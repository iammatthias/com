import { PinataSDK } from "pinata";
import pLimit from "p-limit";

console.log(
  "[Pinata] PINATA_JWT loaded:",
  !!import.meta.env.PINATA_JWT,
  "PINATA_GATEWAY_URL:",
  import.meta.env.PINATA_GATEWAY_URL
);
if (!import.meta.env.PINATA_JWT) {
  throw new Error("[Pinata] PINATA_JWT is missing from environment. Check your .env file and restart the dev server.");
}
if (!import.meta.env.PINATA_GATEWAY_URL) {
  throw new Error(
    "[Pinata] PINATA_GATEWAY_URL is missing from environment. Check your .env file and restart the dev server."
  );
}

export const pinata = new PinataSDK({
  pinataJwt: import.meta.env.PINATA_JWT,
  pinataGateway: import.meta.env.PINATA_GATEWAY_URL,
});

// Pinata File Vector Group ID for all content
export const PINATA_VECTOR_GROUP_ID = "0196fa3e-be6b-73a6-9299-31ccaaa117e5";

// Limit concurrent Pinata requests
const pinataLimit = pLimit(3);

/**
 * Uploads and vectorizes a text file to Pinata in the configured group with optional keyvalues.
 * @param text - The text content to vectorize
 * @param name - The file name (for reference)
 * @param digest - The content digest for change tracking
 * @param keyvalues - Optional keyvalues for metadata (digest will be automatically added)
 * @returns The Pinata file upload response
 */
export async function uploadAndVectorizeText(
  text: string,
  name: string,
  digest: string,
  keyvalues?: Record<string, string>
): Promise<any> {
  const file = new File([text], name, { type: "text/plain" });

  // Ensure digest is always included in keyvalues
  const finalKeyvalues = {
    ...keyvalues,
    digest,
  };

  return pinata.upload.private.file(file).group(PINATA_VECTOR_GROUP_ID).keyvalues(finalKeyvalues).vectorize();
}

/**
 * Retrieves profile content by CID
 * @param cid - The CID of the profile content
 * @returns The profile content as text
 */
export async function getProfileContent(cid: string): Promise<string> {
  try {
    const result = await pinata.gateways.private.get(cid);
    if (!result || !result.data) {
      return "";
    }
    return typeof result.data === "string" ? result.data : result.data.toString();
  } catch (error) {
    console.error(`Failed to retrieve profile content for CID ${cid}:`, error);
    return "";
  }
}

/**
 * Query Pinata vectors for a given query string, returning top matches (optionally with file content).
 * @param query - The semantic query string
 * @param returnFile - If true, returns the file content for the top match
 * @param contentType - Filter by content type ('profile', 'content', or undefined for all)
 * @param includeRecencyContext - If true, includes current date context for better recency matching
 * @returns Query result from Pinata
 */
export async function queryPinataVectors(
  query: string,
  returnFile = false,
  contentType?: "profile" | "content",
  includeRecencyContext = false
): Promise<any> {
  let enhancedQuery = query;

  // Add current date context for recency-aware queries
  if (includeRecencyContext) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.toLocaleString("default", { month: "long" });
    const currentDateString = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Enhance query with temporal context
    enhancedQuery = `${query} current date ${currentDateString} year ${currentYear} month ${currentMonth} recent latest new`;

    console.log(`[PINATA_QUERY] Original query: "${query}"`);
    console.log(`[PINATA_QUERY] Enhanced with recency context: "${enhancedQuery}"`);
  }

  const result = (await pinata.files.private.queryVectors({
    groupId: PINATA_VECTOR_GROUP_ID,
    query: enhancedQuery,
    returnFile,
  })) as any; // Type as any since Pinata SDK types may not be complete

  // Filter by content type if specified, using keyvalues for more accurate filtering
  if (contentType && result?.matches && Array.isArray(result.matches)) {
    result.matches = result.matches.filter((match: any) => {
      // First try to use keyvalues type field
      if (match.keyvalues?.type) {
        if (contentType === "profile") {
          return match.keyvalues.type === "profile";
        } else if (contentType === "content") {
          return match.keyvalues.type === "content";
        }
      }

      // Fallback to filename patterns for legacy files
      if (contentType === "profile") {
        return match.name === "profile.txt" || match.name === "profile.md.txt" || match.name?.includes("profile");
      } else if (contentType === "content") {
        return match.name !== "profile.txt" && match.name !== "profile.md.txt" && !match.name?.includes("profile");
      }

      return true;
    });
  }

  return result;
}

/**
 * Lists all files in the configured Pinata vector group.
 * Handles pagination to ensure all files are retrieved.
 * @returns Array of file metadata objects
 */
export async function listGroupFilesInPinata(): Promise<Array<{ id: string; name: string; cid: string }>> {
  const network = "private";
  const group = PINATA_VECTOR_GROUP_ID;
  const allFiles: Array<{ id: string; name: string; cid: string }> = [];

  let pageToken: string | undefined;
  let hasMore = true;

  while (hasMore) {
    await pinataLimit(async () => {
      try {
        // Build URL with pagination
        let url = `https://api.pinata.cloud/v3/files/${network}?group=${group}&limit=1000`;
        if (pageToken) {
          url += `&pageToken=${pageToken}`;
        }

        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.PINATA_JWT}`,
          },
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Failed to list Pinata files: ${res.status} ${err}`);
        }

        const data = await res.json();
        const files = (data?.data?.files || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          cid: f.cid,
        }));

        allFiles.push(...files);

        // Check if there are more pages
        pageToken = data?.data?.next_page_token;
        hasMore = !!pageToken && files.length > 0;

        console.log(`[Pinata] Fetched ${files.length} files (total: ${allFiles.length}), hasMore: ${hasMore}`);
      } catch (error) {
        console.error(`[Pinata] Error fetching page:`, error);
        hasMore = false; // Stop pagination on error
        throw error;
      }
    });
  }

  console.log(`[Pinata] Total files retrieved: ${allFiles.length}`);
  return allFiles;
}

/**
 * Lists all files in the configured Pinata vector group with their keyvalues.
 * Handles pagination to ensure all files are retrieved.
 * @returns Array of file metadata objects with keyvalues
 */
export async function listGroupFilesWithKeyvaluesInPinata(): Promise<
  Array<{
    id: string;
    name: string;
    cid: string;
    keyvalues?: Record<string, string>;
  }>
> {
  const network = "private";
  const group = PINATA_VECTOR_GROUP_ID;
  const allFiles: Array<{
    id: string;
    name: string;
    cid: string;
    keyvalues?: Record<string, string>;
  }> = [];

  let pageToken: string | undefined;
  let hasMore = true;

  while (hasMore) {
    await pinataLimit(async () => {
      try {
        // Build URL with pagination
        let url = `https://api.pinata.cloud/v3/files/${network}?group=${group}&limit=1000`;
        if (pageToken) {
          url += `&pageToken=${pageToken}`;
        }

        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.PINATA_JWT}`,
          },
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Failed to list Pinata files: ${res.status} ${err}`);
        }

        const data = await res.json();
        const files = (data?.data?.files || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          cid: f.cid,
          keyvalues: f.keyvalues || {},
        }));

        allFiles.push(...files);

        // Check if there are more pages
        pageToken = data?.data?.next_page_token;
        hasMore = !!pageToken && files.length > 0;

        console.log(`[Pinata] Fetched ${files.length} files (total: ${allFiles.length}), hasMore: ${hasMore}`);
      } catch (error) {
        console.error(`[Pinata] Error fetching page:`, error);
        hasMore = false; // Stop pagination on error
        throw error;
      }
    });
  }

  console.log(`[Pinata] Total files retrieved: ${allFiles.length}`);
  return allFiles;
}

/**
 * Selectively deletes files from the Pinata vector group based on digest comparison.
 * @param currentDigests - Map of identifier to current digest for all content types
 * @param contentType - Optional filter by content type (profile, content, summary, etc.)
 * @returns Array of identifiers that were deleted
 */
export async function selectiveCleanupPinataVectors(
  currentDigests: Map<string, string>,
  contentType?: string
): Promise<string[]> {
  try {
    const files = await listGroupFilesWithKeyvaluesInPinata();
    if (files.length === 0) {
      console.log("[Pinata] No files to check in vector group.");
      return [];
    }

    const filesToDelete: { id: string; name: string; identifier: string }[] = [];
    const deletedIdentifiers: string[] = [];

    for (const file of files) {
      // Filter by content type if specified
      if (contentType && file.keyvalues?.type !== contentType) {
        continue;
      }

      // Use slug for content entries, name for others (profile, summary, etc.)
      const fileIdentifier = file.keyvalues?.slug || file.keyvalues?.name || file.name;
      const fileDigest = file.keyvalues?.digest;

      if (!fileIdentifier) {
        // File without identifier metadata, mark for deletion (legacy cleanup)
        filesToDelete.push({ id: file.id, name: file.name, identifier: "unknown" });
        continue;
      }

      const currentDigest = currentDigests.get(fileIdentifier);

      if (!currentDigest) {
        // Entry no longer exists, mark for deletion
        filesToDelete.push({ id: file.id, name: file.name, identifier: fileIdentifier });
        deletedIdentifiers.push(fileIdentifier);
        console.log(`[Pinata] Marking for deletion (entry removed): ${file.name} (${fileIdentifier})`);
      } else if (fileDigest !== currentDigest) {
        // Digest changed, mark for deletion and regeneration
        filesToDelete.push({ id: file.id, name: file.name, identifier: fileIdentifier });
        deletedIdentifiers.push(fileIdentifier);
        console.log(`[Pinata] Marking for deletion (digest changed): ${file.name} (${fileIdentifier})`);
      } else {
        // Digest matches, keep existing vector
        console.log(`[Pinata] Keeping existing vector: ${file.name} (${fileIdentifier})`);
      }
    }

    if (filesToDelete.length === 0) {
      console.log("[Pinata] No files need to be deleted.");
      return [];
    }

    // Batch delete files that need updating
    const fileIds = filesToDelete.map((f) => f.id);
    try {
      const deleteResults = await pinata.files.private.delete(fileIds);

      deleteResults.forEach((result, index) => {
        const file = filesToDelete[index];
        if (result.status === "OK" || result.status === "success") {
          console.log(`[Pinata] Deleted outdated file: ${file.name} (${file.identifier})`);
        } else {
          console.error(`[Pinata] Failed to delete file ${file.id}: ${result.status}`);
        }
      });

      console.log(`[Pinata] Selectively deleted ${fileIds.length} outdated files from vector group.`);
    } catch (err) {
      console.error(`[Pinata] Selective delete failed:`, err);
    }

    return deletedIdentifiers;
  } catch (err) {
    console.error("[Pinata] Selective cleanup failed:", err);
    return [];
  }
}

/**
 * Deletes all files in the Pinata vector group. Logs errors but does not throw.
 */
export async function cleanupPinataVectorGroup(): Promise<void> {
  try {
    const files = await listGroupFilesInPinata();
    if (files.length === 0) {
      console.log("[Pinata] No files to delete in vector group.");
      return;
    }

    // Extract file IDs for batch deletion
    const fileIds = files.map((file) => file.id);

    try {
      // Use SDK's batch delete method
      const deleteResults = await pinata.files.private.delete(fileIds);

      // Log successful deletions
      deleteResults.forEach((result, index) => {
        const file = files[index];
        if (result.status === "OK" || result.status === "success") {
          console.log(`[Pinata] Deleted file: ${file.name} (${file.id})`);
        } else {
          console.error(`[Pinata] Failed to delete file ${file.id}: ${result.status}`);
        }
      });

      console.log(`[Pinata] Batch deleted ${fileIds.length} files from vector group.`);
    } catch (err) {
      console.error(`[Pinata] Batch delete failed:`, err);
    }
  } catch (err) {
    console.error("[Pinata] Cleanup failed to list files:", err);
  }
}

/**
 * Uploads and vectorizes a JSON entry to Pinata with keyvalues for metadata including digest.
 * @param entry - The frontmatter object to vectorize
 * @param name - The file name (for reference)
 * @param digest - The content digest for change tracking
 * @returns The Pinata file upload response
 */
export async function uploadAndVectorizeEntry(
  entry: {
    title: string;
    slug: string;
    path: string;
    created: string;
    updated: string;
    published: boolean;
    tags: string[];
    excerpt?: string;
    [key: string]: any;
  },
  name: string,
  digest: string
): Promise<any> {
  // Create JSON object with just frontmatter (no body content)
  const jsonData = {
    title: entry.title,
    slug: entry.slug,
    path: entry.path,
    created: entry.created,
    updated: entry.updated,
    published: entry.published,
    tags: entry.tags,
    excerpt: entry.excerpt || "",
    permalink: `/${entry.path}/${entry.slug}`,
  };

  // Set up keyvalues for filtering, including digest for change tracking
  const keyvalues = {
    type: "content",
    title: entry.title,
    slug: entry.slug,
    path: entry.path,
    permalink: `/${entry.path}/${entry.slug}`,
    published: entry.published.toString(),
    digest,
  };

  // Upload JSON with keyvalues and vectorization
  return pinata.upload.private.json(jsonData).group(PINATA_VECTOR_GROUP_ID).keyvalues(keyvalues).name(name).vectorize();
}
