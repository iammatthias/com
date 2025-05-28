export const prerender = false;

import type { APIRoute } from "astro";
import { listGroupFilesWithKeyvaluesInPinata, queryPinataVectors } from "../../lib/pinata";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "list";
    const query = url.searchParams.get("query") || "test";
    const namespace = url.searchParams.get("namespace") || "content";

    if (action === "list") {
      // List all files in the vector group
      const files = await listGroupFilesWithKeyvaluesInPinata();

      return new Response(
        JSON.stringify(
          {
            action: "list",
            totalFiles: files.length,
            files: files.map((f) => ({
              id: f.id,
              name: f.name,
              cid: f.cid,
              keyvalues: f.keyvalues,
            })),
          },
          null,
          2
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (action === "search") {
      // Test search functionality
      const result = await queryPinataVectors(query, true, namespace as "profile" | "content", false);

      return new Response(
        JSON.stringify(
          {
            action: "search",
            query,
            namespace,
            totalMatches: result?.matches?.length || 0,
            matches: result?.matches || [],
          },
          null,
          2
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (action === "search-raw") {
      // Test search functionality without content type filtering
      const result = await queryPinataVectors(
        query,
        true,
        undefined, // No content type filtering
        false
      );

      return new Response(
        JSON.stringify(
          {
            action: "search-raw",
            query,
            totalMatches: result?.matches?.length || 0,
            matches: result?.matches || [],
          },
          null,
          2
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error:
          "Invalid action. Use ?action=list or ?action=search&query=your_query&namespace=content or ?action=search-raw&query=your_query",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Debug Pinata API error:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to debug Pinata",
        details: String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
