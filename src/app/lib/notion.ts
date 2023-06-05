import { Readable } from "stream";
import AWS from "aws-sdk";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

const env = process.env;

// Notion env variables
const NOTION_TOKEN = env.NEXT_PUBLIC_NOTION_TOKEN;
const NOTION_ID = env.NEXT_PUBLIC_NOTION_ID;

// Cloudflare env variables
const CLOUDFLARE_ACCESS_KEY_ID = env.NEXT_PUBLIC_CLOUDFLARE_ACCESS_KEY_ID;
const CLOUDFLARE_SECRET_ACCESS_KEY =
  env.NEXT_PUBLIC_CLOUDFLARE_SECRET_ACCESS_KEY;
const CLOUDFLARE_BUCKET_NAME = env.NEXT_PUBLIC_CLOUDFLARE_BUCKET_NAME;
const CLOUDFLARE_ID = env.NEXT_PUBLIC_CLOUDFLARE_ID;

// Initialize Notion client
const notion = new Client({ auth: NOTION_TOKEN });

// Initialize AWS
const s3 = new AWS.S3({
  endpoint: `https://${CLOUDFLARE_ID}.r2.cloudflarestorage.com`,
  accessKeyId: CLOUDFLARE_ACCESS_KEY_ID,
  secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
});

const BUCKET_NAME = CLOUDFLARE_BUCKET_NAME as string;

// Helper functions
const extractKey = (imageUrl: string): string => {
  const url = new URL(imageUrl);
  const parts = url.pathname.split("/");
  return parts[parts.length - 2];
};

const uploadImageToR2 = async (imageUrl: string, key: string): Promise<any> => {
  try {
    await s3.headObject({ Bucket: BUCKET_NAME, Key: key }).promise();
  } catch (error) {
    const response = await fetch(imageUrl);

    if (!response.body) {
      throw new Error("Failed to fetch image");
    }

    const reader = response.body.getReader();
    const stream = new Readable({
      async read() {
        const { done, value } = await reader.read();
        this.push(done ? null : new Uint8Array(value));
      },
    });

    return s3
      .upload({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: stream,
        ContentType:
          response.headers.get("Content-Type") || "application/octet-stream",
      })
      .promise();
  }
};

// Notion operations
const isDev = env.NODE_ENV === "development";
const queryParameters: any = {
  database_id: NOTION_ID,
  sorts: [{ property: "Created", direction: "descending" }],
  filter: !isDev
    ? { property: "Published", checkbox: { equals: true } }
    : undefined,
};

const getTags = (tags: any[]) => tags.map((tag: any) => tag.name);

const getPageMetaData = (post: any) => ({
  id: post.id,
  name: post.properties.Name.title[0].plain_text,
  tags: getTags(post.properties.Tags.multi_select),
  published: post.properties.Published.checkbox,
  created: post.properties.Created.date.start,
  updated: post.last_edited_time,
  type: post.properties.Type.select.name,
  stage: post.properties.Stage.select.name,
  tokenAddress: post.properties.TokenAddress.rich_text[0]?.plain_text,
  tokenId: post.properties.TokenID.rich_text[0]?.plain_text,
  slug: post.properties.Slug.formula.string,
});

export const getAllPublished = async () => {
  const posts = await notion.databases.query(queryParameters);
  return posts.results.map(getPageMetaData);
};

export const getSinglePost = async (slug: string) => {
  const _slug = slug.replace(/-/g, "");
  const response = await notion.databases.query({
    database_id: NOTION_ID as string,
    filter: { property: "Slug", formula: { string: { equals: _slug } } },
  });

  const page = response.results[0];
  const metadata = getPageMetaData(page);
  const mdblocks = await n2m.pageToMarkdown(page.id);
  const mdString = n2m.toMarkdownString(mdblocks);

  return { page, metadata, markdown: mdString };
};

// Initialize NotionToMarkdown
const n2m = new NotionToMarkdown({ notionClient: notion });

// Transformers
n2m.setCustomTransformer("embed", async (block: any) => {
  const embedUrl = block?.embed?.url;
  return embedUrl
    ? `<Iframe src='${embedUrl.replace(
        "music.apple.com",
        "embed.music.apple.com"
      )}' />`
    : "";
});

n2m.setCustomTransformer("image", async (block: any) => {
  const imageUrl = block?.image?.file?.url;
  if (!imageUrl) return "";

  const key = extractKey(imageUrl);
  await uploadImageToR2(imageUrl, key);

  return `<Image src='https://pub-bad9d477a78045ea9f8c0d6fdad56d87.r2.dev/${key}' />`;
});

n2m.setCustomTransformer("video", async (block: any) => {
  const videoUrl = block?.video?.external?.url;
  return videoUrl ? `<Video src='${videoUrl}' />` : "";
});

n2m.setCustomTransformer("child_database", async (block: any) => {
  if (!block?.child_database) return "";

  const metadata = await notion.databases.query({
    database_id: block.id,
    sorts: [{ property: "Created", direction: "descending" }],
  });

  if (!block.child_database.title.includes("Gallery")) return "<></>";

  const gallery = await Promise.all(
    metadata.results.map(async (item) => {
      const mdblocks = await n2m.pageToMarkdown(item.id);
      return mdblocks[0].parent;
    })
  );

  return `<div className="max_width_unset"><Masonry items={[${gallery}]} /></div>`;
});
