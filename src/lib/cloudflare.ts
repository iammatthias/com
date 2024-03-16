// cloudflare.ts

import AWS from "aws-sdk";
import crypto from "crypto";

const r2_key = import.meta.env.r2_key;
const r2_secret = import.meta.env.r2_secret;

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

// Generates a SHA-256 hash of a given object
export function generateHash(object) {
  const data = JSON.stringify(object, Object.keys(object).sort());
  return crypto.createHash("sha256").update(data).digest("hex");
}

// Fetches the existing hash of the tags data
export async function fetchExistingTagsHash() {
  try {
    const { Body } = await s3.getObject({ Bucket: BUCKET_NAME, Key: HASH_FILE_KEY }).promise();
    return Body.toString();
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
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: FILE_KEY,
        Body: body,
        ContentType: "application/json",
      })
      .promise();

    // Also update the hash file with the new hash
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: HASH_FILE_KEY,
        Body: newHash,
        ContentType: "text/plain",
      })
      .promise();
  }
}
