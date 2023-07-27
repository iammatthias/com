import { Readable } from "stream";

import AWS from "aws-sdk";

const env = process.env;

// Cloudflare env variables
const CLOUDFLARE_ACCESS_KEY_ID = env.NEXT_PUBLIC_CLOUDFLARE_ACCESS_KEY_ID;
const CLOUDFLARE_SECRET_ACCESS_KEY =
  env.NEXT_PUBLIC_CLOUDFLARE_SECRET_ACCESS_KEY;
const CLOUDFLARE_BUCKET_NAME = env.NEXT_PUBLIC_CLOUDFLARE_BUCKET_NAME;
const CLOUDFLARE_ID = env.NEXT_PUBLIC_CLOUDFLARE_ID;

// Initialize AWS
const s3 = new AWS.S3({
  endpoint: `https://${CLOUDFLARE_ID}.r2.cloudflarestorage.com`,
  accessKeyId: CLOUDFLARE_ACCESS_KEY_ID,
  secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
});

const BUCKET_NAME = CLOUDFLARE_BUCKET_NAME as string;

// Cloudflare helper functions
export const extractKey = (imageUrl: string): string => {
  const url = new URL(imageUrl);
  const parts = url.pathname.split("/");
  return parts[parts.length - 2];
};

export const uploadImageToR2 = async (
  imageUrl: string,
  key: string
): Promise<any> => {
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
