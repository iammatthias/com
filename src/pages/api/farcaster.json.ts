import type { APIRoute } from "astro";

// Farcaster Hub configuration
const HUB_URL = "https://hub.merv.fun";
const USER_FID = 2728;

// Farcaster epoch starts Jan 1, 2021 00:00:00 UTC
const FARCASTER_EPOCH = 1609459200;

interface FarcasterEmbed {
  url?: string;
  castId?: {
    fid: number;
    hash: string;
  };
}

interface FarcasterCastAddBody {
  text: string;
  embeds: FarcasterEmbed[];
  mentions: number[];
  mentionsPositions: number[];
  parentCastId?: {
    fid: number;
    hash: string;
  };
  parentUrl?: string;
}

interface FarcasterMessage {
  data: {
    type: string;
    fid: number;
    timestamp: number;
    castAddBody?: FarcasterCastAddBody;
  };
  hash: string;
}

interface FarcasterResponse {
  messages: FarcasterMessage[];
  nextPageToken?: string;
}

// Output types
interface NormalizedEmbed {
  type: "url" | "cast";
  url?: string;
  castFid?: number;
  castHash?: string;
}

function farcasterTimestampToDate(timestamp: number): Date {
  return new Date((FARCASTER_EPOCH + timestamp) * 1000);
}

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 10;

    // Fetch more casts than needed since we filter out replies
    const fetchSize = Math.max(limit * 3, 30);

    // Fetch casts from Farcaster hub with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `${HUB_URL}/v1/castsByFid?fid=${USER_FID}&pageSize=${fetchSize}&reverse=true`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(
        `Farcaster hub responded with ${response.status}: ${response.statusText}`,
      );
    }

    const data: FarcasterResponse = await response.json();

    // Process casts - filter to only top-level posts (no replies)
    const posts = data.messages
      .filter((msg) => {
        // Only include cast adds that are not replies
        return (
          msg.data.type === "MESSAGE_TYPE_CAST_ADD" &&
          msg.data.castAddBody &&
          !msg.data.castAddBody.parentCastId &&
          !msg.data.castAddBody.parentUrl
        );
      })
      .map((msg) => {
        const cast = msg.data.castAddBody!;
        const createdAt = farcasterTimestampToDate(msg.data.timestamp);

        // Normalize embeds
        const embeds: NormalizedEmbed[] = cast.embeds
          .map((embed) => {
            if (embed.url) {
              return { type: "url" as const, url: embed.url };
            }
            if (embed.castId) {
              return {
                type: "cast" as const,
                castFid: embed.castId.fid,
                castHash: embed.castId.hash,
              };
            }
            return { type: "url" as const };
          })
          .filter((e) => e.url || e.castHash);

        // Build warpcast URL
        const hashHex = msg.hash.startsWith("0x")
          ? msg.hash.slice(2)
          : msg.hash;
        const postUrl = `https://warpcast.com/~/conversations/${hashHex}`;

        return {
          hash: msg.hash,
          text: cast.text,
          createdAt: createdAt.toISOString(),
          embeds,
          postUrl,
        };
      })
      .slice(0, limit);

    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching from Farcaster:", error);

    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
};
