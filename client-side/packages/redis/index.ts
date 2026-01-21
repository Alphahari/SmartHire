import { createClient } from "redis";

// IMPORTANT: specify the correct port
export const client = createClient({
    url: "redis://localhost:6379"
});

export const pubSubClient = createClient({
    url: "redis://localhost:6380"
});

client.on("error", err => console.error("Redis Client Error", err));
pubSubClient.on("error", err => console.error("Redis PubSub Error", err));

(async () => {
    await client.connect();
    await pubSubClient.connect();
})();
