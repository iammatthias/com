import AWS from "aws-sdk";

const r2_key = import.meta.env.R2_KEY;
const r2_secret = import.meta.env.R2_SECRET;

// Set up Cloudflare R2 endpoint and credentials
const s3 = new AWS.S3({
  endpoint: "https://ea8e8dd71ce896c57be1f426dae21195.r2.cloudflarestorage.com",
  accessKeyId: r2_key,
  secretAccessKey: r2_secret,
  signatureVersion: "v4",
  s3ForcePathStyle: true,
});

const BUCKET_NAME = "obsidian-cms";

export async function getImageKeys(directory: string): Promise<string[]> {
  const params = {
    Bucket: BUCKET_NAME,
    Prefix: directory,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    return data.Contents
      ? data.Contents.map((item) => item.Key).filter(
          (key): key is string => key !== undefined,
        )
      : [];
  } catch (error) {
    console.error("Error fetching image keys:", error);
    throw error; // Rethrow the error after logging
  }
}
