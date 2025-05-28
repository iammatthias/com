export const prerender = false;

import type { APIRoute } from "astro";
import { processChat, checkRateLimit, type ChatRequest } from "../../lib/chat-service";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get client IP for rate limiting
    const clientIP =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For") ||
      request.headers.get("X-Real-IP") ||
      "unknown";

    // Rate limiting check
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please wait a moment before asking another question.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate environment
    const apiKey = import.meta.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not set in environment" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request
    const body = await request.json();
    if (!body || typeof body.message !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid 'message' in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Determine chat type and build request
    let chatRequest: ChatRequest;

    if (body.content) {
      // Content-specific chat
      chatRequest = {
        type: "content",
        message: body.message.trim(),
        content: body.content,
        sessionId: body.sessionId,
      };
    } else {
      // General chat
      chatRequest = {
        type: "general",
        message: body.message.trim(),
        sessionId: body.sessionId,
      };
    }

    // Process chat
    const response = await processChat(chatRequest, apiKey);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
