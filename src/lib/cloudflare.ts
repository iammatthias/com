// cloudflare.ts

import AWS from "aws-sdk";
import crypto from "crypto";

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
const FILE_KEY = "tags.json";
const HASH_FILE_KEY = "tags_hash.txt";
const STAGING_FILE_KEY = "tags-staging.json";
const STAGING_HASH_FILE_KEY = "tags_hash-staging.txt";

// Generates a SHA-256 hash of a given object
export function generateHash(object) {
  const data = JSON.stringify(object, Object.keys(object).sort());
  return crypto.createHash("sha256").update(data).digest("hex");
}

// Fetches the existing hash of the tags data
export async function fetchExistingTagsHash() {
  try {
    const isStaging = import.meta.env.MODE === "development";
    const hashFileKey = isStaging ? STAGING_HASH_FILE_KEY : HASH_FILE_KEY;
    const { Body } = await s3
      .getObject({ Bucket: BUCKET_NAME, Key: hashFileKey })
      .promise();
    return Body!.toString();
  } catch (error) {
    console.error("Error fetching existing tags hash:", error);
    return ""; // Return an empty string if there's no existing hash
  }
}

// Saves the tags data and updates the hash, only if the data has changed
export async function saveTagsData(data, oldHash) {
  const newHash = generateHash(data);
  if (newHash !== oldHash) {
    // Save the new tag data because the hash is different
    const body = JSON.stringify(data);
    const isStaging = import.meta.env.MODE === "development";
    const fileKey = isStaging ? STAGING_FILE_KEY : FILE_KEY;
    const hashFileKey = isStaging ? STAGING_HASH_FILE_KEY : HASH_FILE_KEY;

    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: body,
        ContentType: "application/json",
      })
      .promise();

    // Also update the hash file with the new hash
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: hashFileKey,
        Body: newHash,
        ContentType: "text/plain",
      })
      .promise();
  }
}
