import type { APIRoute } from "astro";
import pLimit from "p-limit";

// Glass API types - matches actual API response structure
interface GlassExif {
  camera?: string;
  lens?: string;
  aperture?: string;
  focal_length?: string;
  iso?: string;
  exposure_time?: string;
}

interface GlassPhoto {
  id: string;
  width: number;
  height: number;
  image640x640: string;
  share_url: string;
  created_at: string;
  description?: string;
  exif?: GlassExif;
}

// Limit concurrent requests to Glass API
const glassLimit = pLimit(2);

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    // Get limit from query params, default to 50
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 50;

    console.log(`URL: ${url.toString()}`);
    console.log(`Limit param: ${limitParam}`);
    console.log(`Fetching Glass photos from external API (limit: ${limit})`);

    // Fetch directly from Glass API
    const glassResponse = await glassLimit(async () => {
      // Glass.photo API endpoint - this may need to be adjusted based on their actual API
      // Using the user profile API for @iam
      const glassApiUrl = `https://glass.photo/api/v3/users/iam/posts?limit=${limit}`;

      const response = await fetch(glassApiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "iammatthias.com/1.0", // Identify our site
        },
      });

      console.log(response);

      if (!response.ok) {
        throw new Error(`Glass API responded with ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });

    // Process and validate the photos - API returns array directly, not wrapped in an object
    const photos: GlassPhoto[] = Array.isArray(glassResponse) ? glassResponse : [];

    const validPhotos = photos
      .filter((photo): photo is GlassPhoto => {
        return (
          photo &&
          typeof photo.id === "string" &&
          typeof photo.width === "number" &&
          typeof photo.height === "number" &&
          typeof photo.image640x640 === "string" &&
          typeof photo.share_url === "string" &&
          typeof photo.created_at === "string"
        );
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
      .map((photo) => ({
        id: photo.id,
        width: photo.width,
        height: photo.height,
        image640x640: photo.image640x640,
        share_url: photo.share_url,
        created_at: photo.created_at,
        caption: photo.description || "",
        exif: photo.exif
          ? {
              camera: photo.exif.camera,
              lens: photo.exif.lens,
              aperture: photo.exif.aperture,
              focal_length: photo.exif.focal_length,
              iso: photo.exif.iso,
              exposure_time: photo.exif.exposure_time,
            }
          : undefined,
      }));

    console.log(`Successfully fetched ${validPhotos.length} photos from Glass API`);

    return new Response(JSON.stringify(validPhotos), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error("Error fetching from Glass API:", error);

    // For development/fallback, return empty array instead of error
    // This allows the site to function even if Glass API is unavailable
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60", // Shorter cache for errors
      },
    });
  }
};
