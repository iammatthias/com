// hero-image.ts
import { getImageKeys } from "@lib/cloudflare";

export const prerender = false;

export async function GET() {
  const directory = "hero_images/";
  const keys = await getImageKeys(directory);

  if (keys.length === 0) {
    return new Response("No images found in the directory", { status: 404 });
  }

  // Send multiple keys instead of one
  const imageUrls = keys.map(
    (key) => `https://pub-ba3d6ef16e5c44b7b4b89835777f6653.r2.dev/${key}`,
  );

  return new Response(JSON.stringify({ imageUrls }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400", // Cache for one day
    },
    status: 200,
  });
}
