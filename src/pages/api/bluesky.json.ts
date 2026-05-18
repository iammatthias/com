import type { APIRoute } from "astro";

// PDS configuration
const USER_DID = "did:plc:p5xem22ammiafn5kxonaksfa";
const PDS_HOST = "https://pds.iammatthias.com";

// Raw record types from PDS
interface BlobRef {
  $type: "blob";
  ref: { $link: string };
  mimeType: string;
  size: number;
}

interface RawImageEmbed {
  $type: "app.bsky.embed.images";
  images: Array<{
    alt: string;
    image: BlobRef;
    aspectRatio?: { width: number; height: number };
  }>;
}

interface RawVideoEmbed {
  $type: "app.bsky.embed.video";
  video: BlobRef;
  alt?: string;
  aspectRatio?: { width: number; height: number };
}

interface RawExternalEmbed {
  $type: "app.bsky.embed.external";
  external: {
    uri: string;
    title: string;
    description: string;
    thumb?: BlobRef;
  };
}

interface RawRecordEmbed {
  $type: "app.bsky.embed.record";
  record: {
    uri: string;
    cid: string;
  };
}

interface RawRecordWithMediaEmbed {
  $type: "app.bsky.embed.recordWithMedia";
  record: RawRecordEmbed;
  media: RawImageEmbed | RawVideoEmbed | RawExternalEmbed;
}

type RawEmbed =
  | RawImageEmbed
  | RawVideoEmbed
  | RawExternalEmbed
  | RawRecordEmbed
  | RawRecordWithMediaEmbed;

interface RawPostRecord {
  $type: "app.bsky.feed.post";
  text: string;
  createdAt: string;
  embed?: RawEmbed;
  reply?: {
    root: { uri: string; cid: string };
    parent: { uri: string; cid: string };
  };
  langs?: string[];
  facets?: Array<{
    index: { byteStart: number; byteEnd: number };
    features: Array<{
      $type: string;
      uri?: string;
      did?: string;
      tag?: string;
    }>;
  }>;
}

interface PDSRecord {
  uri: string;
  cid: string;
  value: RawPostRecord;
}

interface ListRecordsResponse {
  records: PDSRecord[];
  cursor?: string;
}

// Output types - normalized for the component
interface NormalizedImage {
  type: "image";
  thumb: string;
  fullsize: string;
  alt: string;
  aspectRatio?: { width: number; height: number };
  mimeType: string;
}

interface NormalizedVideo {
  type: "video";
  url: string;
  alt?: string;
  aspectRatio?: { width: number; height: number };
  mimeType: string;
}

interface NormalizedExternal {
  type: "external";
  uri: string;
  title: string;
  description: string;
  thumb?: string;
}

interface NormalizedQuote {
  type: "quote";
  uri: string;
  cid: string;
}

type NormalizedEmbed =
  | NormalizedImage
  | NormalizedVideo
  | NormalizedExternal
  | NormalizedQuote;

// Build blob URL from PDS
function getBlobUrl(did: string, cid: string): string {
  return `${PDS_HOST}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`;
}

function normalizeEmbed(embed: RawEmbed, did: string): NormalizedEmbed[] {
  const embeds: NormalizedEmbed[] = [];

  switch (embed.$type) {
    case "app.bsky.embed.images":
      for (const img of embed.images) {
        const blobCid = img.image.ref.$link;
        const url = getBlobUrl(did, blobCid);
        embeds.push({
          type: "image",
          thumb: url,
          fullsize: url,
          alt: img.alt || "",
          aspectRatio: img.aspectRatio,
          mimeType: img.image.mimeType,
        });
      }
      break;

    case "app.bsky.embed.video":
      const videoCid = embed.video.ref.$link;
      embeds.push({
        type: "video",
        url: getBlobUrl(did, videoCid),
        alt: embed.alt,
        aspectRatio: embed.aspectRatio,
        mimeType: embed.video.mimeType,
      });
      break;

    case "app.bsky.embed.external":
      embeds.push({
        type: "external",
        uri: embed.external.uri,
        title: embed.external.title,
        description: embed.external.description,
        thumb: embed.external.thumb
          ? getBlobUrl(did, embed.external.thumb.ref.$link)
          : undefined,
      });
      break;

    case "app.bsky.embed.record":
      embeds.push({
        type: "quote",
        uri: embed.record.uri,
        cid: embed.record.cid,
      });
      break;

    case "app.bsky.embed.recordWithMedia":
      // Process the media portion
      if (embed.media) {
        embeds.push(...normalizeEmbed(embed.media, did));
      }
      // Process the quoted record
      if (embed.record) {
        embeds.push(...normalizeEmbed(embed.record, did));
      }
      break;
  }

  return embeds;
}

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    // Get limit from query params, default to 10
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 10;

    // Fetch records directly from PDS - no auth needed for public records
    const recordsUrl = `${PDS_HOST}/xrpc/com.atproto.repo.listRecords?repo=${USER_DID}&collection=app.bsky.feed.post&limit=${limit}&reverse=true`;

    const response = await fetch(recordsUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "iammatthias.com/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(
        `PDS API responded with ${response.status}: ${response.statusText}`,
      );
    }

    const data: ListRecordsResponse = await response.json();

    // Process and transform the posts, sort by date descending (newest first)
    const posts = data.records
      .filter((record) => {
        // Filter out replies, only show original posts
        return !record.value.reply;
      })
      .sort(
        (a, b) =>
          new Date(b.value.createdAt).getTime() -
          new Date(a.value.createdAt).getTime(),
      )
      .map((record) => {
        const post = record.value;

        // Normalize all embeds
        const embeds: NormalizedEmbed[] = post.embed
          ? normalizeEmbed(post.embed, USER_DID)
          : [];

        // Extract post ID from URI for the link
        const uriParts = record.uri.split("/");
        const postId = uriParts[uriParts.length - 1];

        return {
          uri: record.uri,
          cid: record.cid,
          text: post.text,
          createdAt: post.createdAt,
          embeds,
          facets: post.facets,
          // No engagement counts from raw PDS records
          postUrl: `https://bsky.app/profile/${USER_DID}/post/${postId}`,
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
    console.error("Error fetching from PDS:", error);

    // Return empty array on error to allow the site to function
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
};
