import AWS from "aws-sdk";
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

// Notion env variables
const NOTION_TOKEN = process.env.NEXT_PUBLIC_NOTION_TOKEN;
const NOTION_ID = process.env.NEXT_PUBLIC_NOTION_ID;

// Cloudflare env variables
const CLOUDFLARE_ACCESS_KEY_ID =
  process.env.NEXT_PUBLIC_CLOUDFLARE_ACCESS_KEY_ID;
const CLOUDFLARE_SECRET_ACCESS_KEY =
  process.env.NEXT_PUBLIC_CLOUDFLARE_SECRET_ACCESS_KEY;
const CLOUDFLARE_BUCKET_NAME = process.env.NEXT_PUBLIC_CLOUDFLARE_BUCKET_NAME;
const CLOUDFLARE_ID = process.env.NEXT_PUBLIC_CLOUDFLARE_ID;

// Initialize Notion client
const notion = new Client({ auth: NOTION_TOKEN });

// Get tags from Notion
const getTags = (tags: any[]) => tags.map((tag: any) => tag.name);

// Get page metadata from Notion
const getPageMetaData = (post: any) => ({
  id: post.id,
  name: post.properties.Name.title[0].plain_text,
  tags: getTags(post.properties.Tags.multi_select),
  published: post.properties.Published.checkbox,
  created: post.created_time,
  updated: post.last_edited_time,
  type: post.properties.Type.select.name,
  stage: post.properties.Stage.select.name,
  tokenAddress: post.properties.TokenAddress.plain_text,
  tokenId: post.properties.TokenID.number,
  slug: post.properties.Slug.formula.string,
});

// Get all published posts from Notion
export const getAllPublished = async () => {
  const isDev = process.env.NODE_ENV === "development";

  let queryParameters: any = {
    database_id: NOTION_ID,
    sorts: [{ property: "Created", direction: "descending" }],
  };

  if (!isDev) {
    queryParameters.filter = {
      property: "Published",
      checkbox: { equals: true },
    };
  }

  const posts = await notion.databases.query(queryParameters);

  return posts.results.map(getPageMetaData);
};

// Get a single post from Notion
export const getSinglePost = async (slug: string) => {
  const _slug = slug.replace(/-/g, "");
  if (!NOTION_ID) {
    throw new Error("NOTION_ID is undefined");
  }
  const response = await notion.databases.query({
    database_id: NOTION_ID,
    filter: {
      property: "Slug",
      formula: { string: { equals: _slug } },
    },
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
// embed transformer
n2m.setCustomTransformer("embed", async (block) => {
  const { embed } = block as any;
  if (!embed?.url) return "";
  const embedUrl = embed.url;
  return `<Iframe src='${embedUrl.replace(
    "music.apple.com",
    "embed.music.apple.com"
  )}' />`;
});

// image transformer
// n2m.setCustomTransformer("image", async (block) => {
//   const { image } = block as any;
//   if (!image.file.url) return "";
//   const imageUrl = image.file.url;
//   return `<img src='${imageUrl}' />`;
// });

// image transformer
n2m.setCustomTransformer("image", async (block) => {
  const { image } = block as any;
  if (!image.file.url) return "";

  const imageUrl = image.file.url;
  const key = extractKey(imageUrl);
  await uploadImageToR2(imageUrl, key);

  // The new URL for the image on your domain
  const newImageUrl = `https://pub-bad9d477a78045ea9f8c0d6fdad56d87.r2.dev/${key}`;

  return `<Image src='${newImageUrl}' />`;
});

// video transformer
n2m.setCustomTransformer("video", async (block) => {
  const { video } = block as any;
  if (!video.external.url) return "";
  const videoUrl = video.external.url;
  return `<Video src='${videoUrl}' />`;
});

// gallery transformer
n2m.setCustomTransformer("child_database", async (block) => {
  const { child_database } = block as any;
  if (!child_database) return "";

  const metadata = await notion.databases.query({
    database_id: block.id,
    sorts: [
      {
        property: "Created",
        direction: "descending",
      },
    ],
  });

  if (child_database.title.includes("Gallery")) {
    n2m.setCustomTransformer("image", async (block) => {
      const { image } = block as any;
      if (!image.file.url) return "";

      const imageUrl = image.file.url;
      const key = extractKey(imageUrl);
      await uploadImageToR2(imageUrl, key);

      // The new URL for the image on your domain
      const newImageUrl = `https://pub-bad9d477a78045ea9f8c0d6fdad56d87.r2.dev/${key}`;

      // return `<img src='${newImageUrl}' />`;
      return `<>${newImageUrl}</>`;
    });

    const gallery = metadata.results.map(async (item) => {
      const mdblocks = await n2m.pageToMarkdown(item.id);
      return mdblocks[0].parent;
    });
    const _gallery = await Promise.all(gallery);

    // flatten _gallery and remove commas
    const flatten = _gallery.flat(Infinity).join("").replace(/,/g, "");

    // return `<div className="gallery max_width_unset">${flatten}</div>`;
    return `<div className="max_width_unset"><Masonry items={[${_gallery}]} /></div>`;
  }

  return `<></>`;
});

// Handle images from Notion
// Initialize the AWS SDK with your Cloudflare credentials
const s3 = new AWS.S3({
  endpoint: `https://${CLOUDFLARE_ID}.r2.cloudflarestorage.com`,
  accessKeyId: CLOUDFLARE_ACCESS_KEY_ID,
  secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
});

// Your Cloudflare R2 bucket name
const BUCKET_NAME = CLOUDFLARE_BUCKET_NAME as string;

// Function to extract key from Notion image URL
function extractKey(imageUrl: string): string {
  const url = new URL(imageUrl);
  const parts = url.pathname.split("/");
  return parts[parts.length - 2];
}

// Function to upload image to R2
async function uploadImageToR2(imageUrl: string, key: string): Promise<any> {
  // Check if image with this key has already been uploaded
  const existingImage = await s3
    .headObject({ Bucket: BUCKET_NAME, Key: key })
    .promise()
    .catch(() => null);

  if (existingImage) {
    return;
  }

  // Fetch the image
  const response = await fetch(imageUrl);
  const blob = await response.arrayBuffer();

  // Upload the image to R2
  await s3
    .upload({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: Buffer.from(blob),
      ContentType: response.headers.get("Content-Type") as string,
    })
    .promise();
}
