// src/lib/vercel-kv-client.ts
import { createClient } from "@vercel/kv";

export const kvClient = createClient({
  url: process.env.KV_REST_API_URL!, // Non-null assertion here
  token: process.env.KV_REST_API_TOKEN!, // And here
});
