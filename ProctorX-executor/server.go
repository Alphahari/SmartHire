package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/mount"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

type TestCases struct {
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
}

type Task struct {
	Lang      string      `json:"lang"`
	Code      string      `json:"code"`
	ID        string      `json:"id"`
	TestCases []TestCases `json:"test_cases"`
}

func main() {

	// Load environment variables
	if err := godotenv.Load(".env"); err != nil {
		log.Fatal("Error loading .env file:", err)
	}

	// Main context for long-running worker
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	redisClient := initRedisClient()
	dockerClient, err := initDockerClient()
	if err != nil {
		log.Fatal(err)
	}
	defer dockerClient.Close()

	fmt.Println("Redis Client created!")
	fmt.Println("Docker Client created!")

	// Begin infinite job processing loop
	processSubmission(ctx, redisClient, dockerClient)
}

/*
-------------------------------------------------------
------------------ REDIS JOB LOOP ---------------------
-------------------------------------------------------
*/

func processSubmission(ctx context.Context, redisClient *redis.Client, dockerClient *client.Client) {
	for {
		// Wait for next submission from queue
		submission := redisClient.BRPop(ctx, 0, "submissions")

		result, err := submission.Result()
		if err != nil {
			log.Printf("Error retrieving data from BRPop: %v", err)
			continue
		}

		if len(result) < 2 {
			log.Println("Invalid Redis BRPop response. Skipping...")
			continue
		}

		jsonData := result[1]

		var task Task
		if err := json.Unmarshal([]byte(jsonData), &task); err != nil {
			log.Printf("Error unmarshaling JSON: %v", err)
			continue
		}

		// Create file for user code
		filename := uuid.NewString() + "." + task.Lang
		filename = strings.ReplaceAll(filename, "-", "_")

		// Java requires filename to match `public class`
		if task.Lang == "java" {
			filename = "Main_" + filename
		}

		filePath := "executions/" + filename
		codeFile, err := os.Create(filePath)
		if err != nil {
			panic(err)
		}

		// Prepare code
		finalCode := task.Code
		if task.Lang == "java" {
			className := strings.Split(filename, ".")[0]
			finalCode = strings.Replace(task.Code, "public class Main", "public class "+className, 1)
		}

		if _, err := codeFile.WriteString(finalCode); err != nil {
			panic(err)
		}
		codeFile.Close()

		fmt.Printf("Processing %s submission.\n", task.Lang)

		// Determine run command + container image
		command := getRunCommand(task.Lang, filename)
		image := getDockerImage(task.Lang)

		// Create container for execution
		containerResp, err := dockerClient.ContainerCreate(ctx, &container.Config{
			Image: image,
			// Command is NOT inserted here — executed via ContainerExec later.
		}, &container.HostConfig{
			Mounts: []mount.Mount{
				{
					Type:   mount.TypeBind,
					Source: os.Getenv("SOURCE_MOUNT"),
					Target: os.Getenv("DESTINATION_MOUNT"),
				},
			},
		}, nil, nil, "")

		if err != nil {
			log.Printf("Error creating container: %v", err)
			continue
		}

		// Run test cases inside container
		executeTaskInContainer(ctx, dockerClient, command, redisClient, containerResp.ID, task, filename)
	}
}

/*
-------------------------------------------------------
--------- EXECUTION OF CODE INSIDE DOCKER -------------
-------------------------------------------------------
*/

func executeTaskInContainer(
	ctx context.Context,
	dockerClient *client.Client,
	baseCommand []string,
	redisClient *redis.Client,
	containerID string,
	task Task,
	filename string,
) {
	// Start container
	if err := dockerClient.ContainerStart(ctx, containerID, container.StartOptions{}); err != nil {
		log.Printf("Error starting container %s: %v", containerID, err)
		return
	}

	var allResults []map[string]string

	// baseCommand is ["sh", "-c", "<real_cmd>"]
	realCmd := baseCommand[2] // Extract actual compiler+run command

	for i, tc := range task.TestCases {

		// Timeout for each test
		execCtx, cancel := context.WithTimeout(ctx, 10*time.Second)

		/*
			⭐ FIX FOR JAVA/C++ INPUT:
			We wrap the entire compile+run command in a second "sh -c"
			so that echo pipes into the _final executable_, not the compiler.
		*/
		safeWrapped := fmt.Sprintf(
			"echo \"%s\" | sh -c '%s'",
			tc.Input,
			realCmd,
		)

		cmd := []string{"sh", "-c", safeWrapped}

		// Create execution environment
		execID, err := dockerClient.ContainerExecCreate(execCtx, containerID, container.ExecOptions{
			Cmd:          cmd,
			AttachStdout: true,
			AttachStderr: true,
		})

		if err != nil {
			log.Printf("Exec create failed test %d: %v", i, err)
			cancel()
			continue
		}

		// Attach to running process
		resp, err := dockerClient.ContainerExecAttach(execCtx, execID.ID, container.ExecAttachOptions{Tty: false})
		if err != nil {
			log.Printf("Exec attach failed test %d: %v", i, err)
			cancel()
			continue
		}

		var stdoutBuf, stderrBuf bytes.Buffer
		done := make(chan struct{})

		// Read output
		go func() {
			stdcopy.StdCopy(&stdoutBuf, &stderrBuf, resp.Reader)
			close(done)
		}()

		// Evaluate execution result
		select {
		case <-done:
			resp.Close()
			output := strings.TrimSpace(stdoutBuf.String())
			errText := strings.TrimSpace(stderrBuf.String())

			result := map[string]string{
				"input":    tc.Input,
				"expected": tc.ExpectedOutput,
				"output":   output,
				"error":    errText,
			}

			if errText == "" && output == strings.TrimSpace(tc.ExpectedOutput) {
				result["status"] = "PASSED"
			} else {
				result["status"] = "FAILED"
			}

			allResults = append(allResults, result)

		case <-execCtx.Done():
			resp.Close()

			log.Printf("Test %d timed out. Killing container...", i)
			_ = dockerClient.ContainerKill(ctx, containerID, "SIGKILL")

			allResults = append(allResults, map[string]string{
				"input":    tc.Input,
				"expected": tc.ExpectedOutput,
				"output":   "",
				"error":    "Time Limit Exceeded",
				"status":   "TIMEOUT",
			})
		}

		cancel()
	}

	// Send results to Redis pub/sub channel
	resultBytes, _ := json.Marshal(allResults)
	publishToRedis(ctx, redisClient, task.ID, string(resultBytes))

	// Cleanup
	removeUserFiles(filename, task)
	cleanupContainer(ctx, dockerClient, containerID)
}

/*
-------------------------------------------------------
-------------------- HTTP SERVER -----------------------
-------------------------------------------------------
*/

