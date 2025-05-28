export const prerender = false;

import type { APIRoute } from "astro";
import { pinata, PINATA_VECTOR_GROUP_ID } from "../../lib/pinata";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const action = body.action || "test";

    if (action === "vectorize-test") {
      // Create a simple test file and vectorize it
      const testContent = "This is a test recipe for pizza margherita with tomatoes and mozzarella cheese.";
      const testFile = new File([testContent], "test-pizza-recipe.txt", { type: "text/plain" });

      console.log("[TEST] Uploading and vectorizing test file...");

      const upload = await pinata.upload.private
        .file(testFile)
        .group(PINATA_VECTOR_GROUP_ID)
        .keyvalues({
          type: "content",
          name: "Test Pizza Recipe",
          test: "true",
        })
        .vectorize();

      console.log("[TEST] Upload result:", upload);

      return new Response(
        JSON.stringify({
          action: "vectorize-test",
          success: true,
          fileId: upload.id,
          cid: upload.cid,
          message: "Test file uploaded and vectorized",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (action === "query-test") {
      // Query for the test content
      console.log("[TEST] Querying for pizza content...");

      const result = (await pinata.files.private.queryVectors({
        groupId: PINATA_VECTOR_GROUP_ID,
        query: "pizza recipe",
        returnFile: false,
      })) as any;

      console.log("[TEST] Query result:", result);

      return new Response(
        JSON.stringify({
          action: "query-test",
          query: "pizza recipe",
          totalMatches: result?.matches?.length || 0,
          matches: result?.matches || [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (action === "vectorize-existing") {
      // Try to vectorize an existing file
      const fileId = body.fileId;
      if (!fileId) {
        return new Response(
          JSON.stringify({
            error: "fileId required for vectorize-existing action",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.log(`[TEST] Vectorizing existing file: ${fileId}`);

      const result = await pinata.files.private.vectorize(fileId);

      console.log("[TEST] Vectorize result:", result);

      return new Response(
        JSON.stringify({
          action: "vectorize-existing",
          fileId,
          result,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Invalid action. Use vectorize-test, query-test, or vectorize-existing",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Test vectorize API error:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to test vectorization",
        details: String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
