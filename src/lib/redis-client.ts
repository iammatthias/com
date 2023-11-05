// utils/redis-client.ts
import { createClient } from "@vercel/kv";

export const redisClient = createClient({
  url: process.env.KV_REST_API_URL!, // Non-null assertion here
  token: process.env.KV_REST_API_TOKEN!, // And here
});
