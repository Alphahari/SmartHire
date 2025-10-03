import { createClient } from 'redis';

export const client = createClient();
export const pubSubClient = createClient();

client.on('error', err => console.log('Redis Client Error', err));

(async () => {
    await client.connect();
    await pubSubClient.connect();
})();