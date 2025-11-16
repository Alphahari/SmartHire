package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
	"github.com/redis/go-redis/v9"
)

/*
-------------------------------------------------------
---------------- REDIS / DOCKER INIT -------------------
-------------------------------------------------------
*/

func publishToRedis(ctx context.Context, redisClient *redis.Client, submissionID string, output string) {
	redisClient.Publish(ctx, submissionID, output)
	fmt.Printf("Published results to %s\n", submissionID)
}

func initDockerClient() (*client.Client, error) {
	return client.NewClientWithOpts(
		client.WithAPIVersionNegotiation(),
		client.WithHost(os.Getenv("DOCKER_HOST")),
	)
}

func initRedisClient() *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_HOST_ADDRESS"),
		Password: "",
		DB:       0,
		Protocol: 2,
	})
}

/*
-------------------------------------------------------
------------------ LANGUAGE HANDLERS -------------------
-------------------------------------------------------
*/

func getDockerImage(lang string) string {
	images := map[string]string{
		"py":   "python_proctorx",
		"java": "java_proctorx",
		"cpp":  "cpp_proctorx",
		"c":    "cpp_proctorx",
	}
	return images[lang]
}

/*
	Generate the actual RUN COMMAND that will be executed in the container.
	This command is passed into:

		sh -c "<compiled/run command>"
*/
func getRunCommand(lang string, filename string) []string {

	switch lang {

	case "py":
		return []string{"sh", "-c", fmt.Sprintf("python3 /executions/%s", filename)}

	case "java":
		className := strings.Split(filename, ".")[0]
		return []string{"sh", "-c",
			fmt.Sprintf("javac /executions/%s && java -cp /executions %s",
				filename, className)}

	case "cpp":
		out := "/executions/" + strings.Split(filename, ".")[0]
		return []string{"sh", "-c",
			fmt.Sprintf("g++ /executions/%s -o %s && %s",
				filename, out, out)}

	case "c":
		out := "/executions/" + strings.Split(filename, ".")[0]
		return []string{"sh", "-c",
			fmt.Sprintf("gcc /executions/%s -o %s && %s",
				filename, out, out)}
	}

	log.Printf("Unsupported language: %s", lang)
	return nil
}

/*
-------------------------------------------------------
---------------- CLEANUP HELPERS -----------------------
-------------------------------------------------------
*/

func removeUserFiles(filename string, task Task) {
	os.Remove("executions/" + filename)

	base := "executions/" + strings.Split(filename, ".")[0]

	switch task.Lang {
	case "java":
		os.Remove(base + ".class")
	case "cpp", "c":
		os.Remove(base)
	}
}

func cleanupContainer(ctx context.Context, cli *client.Client, containerID string) {
	if err := cli.ContainerRemove(ctx, containerID, container.RemoveOptions{Force: true}); err != nil {
		log.Printf("Error removing container %s: %v", containerID, err)
	}
}
