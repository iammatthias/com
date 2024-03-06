import AWS from "aws-sdk";

const r2_key = import.meta.env.r2_key;
const r2_secret = import.meta.env.r2_secret;

// Set up Cloudflare R2 endpoint and credentials
const s3 = new AWS.S3({
  endpoint: "https://ea8e8dd71ce896c57be1f426dae21195.r2.cloudflarestorage.com",
  accessKeyId: r2_key, // Replace with your R2 access key
  secretAccessKey: r2_secret, // Replace with your R2 secret key
  signatureVersion: "v4",
  s3ForcePathStyle: true, // Needed for custom endpoints
});

const BUCKET_NAME = "obsidian-cms"; // Replace with your R2 bucket name
const FILE_KEY = "tags.json"; // The name of the file where tags data is stored

// Function to fetch existing tags data from Cloudflare R2
export async function fetchExistingTags(): Promise<any> {
  try {
    const { Body } = await s3.getObject({ Bucket: BUCKET_NAME, Key: FILE_KEY }).promise();
    return JSON.parse(Body!.toString());
  } catch (error) {
    console.error("Error fetching existing tags:", error);
    // If the file doesn't exist or other errors occur, return an empty object
    return {};
  }
}

// Function to save updated tags data to Cloudflare R2
export async function saveTagsData(data: any): Promise<void> {
  const body = JSON.stringify(data);
  await s3
    .putObject({
      Bucket: BUCKET_NAME,
      Key: FILE_KEY,
      Body: body,
      ContentType: "application/json",
    })
    .promise();
}

// Add this function to compare existing tags data with new tags data
export function hasDataChanged(existingTags: Record<string, any>, newTags: Record<string, any>): boolean {
  // Convert both existingTags and newTags to their string representations
  const existingTagsStr = JSON.stringify(existingTags, Object.keys(existingTags).sort());
  const newTagsStr = JSON.stringify(newTags, Object.keys(newTags).sort());

  // Return true if the string representations are not equal, indicating a change
  return existingTagsStr !== newTagsStr;
}
