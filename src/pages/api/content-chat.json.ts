import type { APIRoute } from "astro";
import { addLinksToResponse } from "../../lib/chat-links";

export const prerender = false;

// Core system prompt for content-specific chat
const CONTENT_CHAT_SYSTEM_PROMPT = `You are continuing a conversation about specific content from your website. Answer questions about the provided content naturally and directly.

## Response Guidelines:
- Answer based on the specific content provided
- Reference relevant parts of the content when helpful
- Keep responses conversational and concise (2-4 sentences typically)
- If asked about something not covered in the content, mention that clearly
- Maintain your natural, authentic voice

## Content Context:
You'll be provided with the full content of a specific post, recipe, or article. Focus your answers on this content.`;

// Simple rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // Higher limit for content chat

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const current = requestCounts.get(ip);

  if (!current || now > current.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return false;
  }

  current.count++;
  return true;
}

// Session storage for conversation context
const sessionStore = new Map<
  string,
  {
    messages: Array<{ role: "user" | "assistant"; content: string; timestamp?: number }>;
    lastActivity: number;
    contentSlug: string;
  }
>();

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
const MAX_CONVERSATION_LENGTH = 10; // Shorter for content chat

function getSession(sessionId: string, contentSlug: string) {
  let session = sessionStore.get(sessionId);
  if (!session || session.contentSlug !== contentSlug) {
    session = { messages: [], lastActivity: Date.now(), contentSlug };
    sessionStore.set(sessionId, session);
  }
  return session;
}

function updateSession(sessionId: string, contentSlug: string, userMessage: string, assistantResponse: string) {
  const session = getSession(sessionId, contentSlug);
  session.messages.push(
    { role: "user", content: userMessage, timestamp: Date.now() },
    { role: "assistant", content: assistantResponse, timestamp: Date.now() }
  );

  if (session.messages.length > MAX_CONVERSATION_LENGTH) {
    session.messages = session.messages.slice(-MAX_CONVERSATION_LENGTH);
  }

  session.lastActivity = Date.now();
}

function buildConversationContext(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxMessages: number = 4
): string {
  if (messages.length === 0) return "";

  const recentMessages = messages.slice(-maxMessages);
  const contextLines = recentMessages.map((msg) => {
    const role = msg.role === "user" ? "User" : "Matthias";
    return `${role}: ${msg.content}`;
  });

  return contextLines.join("\n");
}

// Content validation
function validateMessageContent(message: string): { isValid: boolean; reason?: string; suggestion?: string } {
  const harmfulPatterns = [
    /ignore.*(previous|above|system|instructions|prompt|context)/i,
    /you are now|act as|pretend to be|roleplay|imagine you are|simulate|behave like/i,
    /forget.*(instructions|context|guidelines|rules|system|prompt)/i,
    /override.*(safety|guidelines|rules|instructions|system)/i,
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(message)) {
      return {
        isValid: false,
        reason: "inappropriate_content",
        suggestion: "Please ask questions about the content.",
      };
    }
  }

  if (message.length > 500) {
    return {
      isValid: false,
      reason: "message_too_long",
      suggestion: "Please keep your questions concise.",
    };
  }

  return { isValid: true };
}

interface ContentChatRequest {
  message: string;
  content: {
    title: string;
    slug: string;
    path: string;
    body: string;
    tags: string[];
    created: string;
    updated: string;
  };
  sessionId?: string;
}

interface ContentChatResponse {
  answer: string;
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=" +
    apiKey;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini API error response:", err);
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("Gemini API returned no answer");
  }

  return data.candidates[0].content.parts[0].text as string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limiting
    const clientIP =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For") ||
      request.headers.get("X-Real-IP") ||
      "unknown";

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

    const apiKey = import.meta.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not set in environment" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: ContentChatRequest = await request.json();
    if (!body || typeof body.message !== "string" || !body.content) {
      return new Response(JSON.stringify({ error: "Missing or invalid request data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userMessage = body.message.trim();
    const sessionId = body.sessionId || "unknown";
    const content = body.content;

    console.log(`[CONTENT_CHAT] Processing question about: ${content.title}`);

    // Content validation
    const validation = validateMessageContent(userMessage);
    if (!validation.isValid) {
      const blockedResponse: ContentChatResponse = {
        answer: validation.suggestion || "Please ask questions about the content.",
      };
      return new Response(JSON.stringify(blockedResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get session and conversation context
    const session = getSession(sessionId, content.slug);
    const conversationContext = buildConversationContext(session.messages);

    // Build the prompt with the specific content
    let prompt = CONTENT_CHAT_SYSTEM_PROMPT;

    // Add conversation history if available
    if (conversationContext) {
      prompt += `\n\n## Recent Conversation:\n${conversationContext}`;
    }

    // Add the specific content
    const contentType = content.path.slice(0, -1); // Remove 's' from 'posts', 'recipes', etc.
    const formattedDate = new Date(content.created).toLocaleDateString();

    prompt += `\n\n## The ${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Content:`;
    prompt += `\nTitle: ${content.title}`;
    prompt += `\nPublished: ${formattedDate}`;
    if (content.tags && content.tags.length > 0) {
      prompt += `\nTags: ${content.tags.join(", ")}`;
    }
    prompt += `\n\nContent:\n${content.body}`;

    // Add the current user message
    prompt += `\n\n## User Question:\n"${userMessage}"`;

    // Add specific instructions based on content type
    if (content.path === "recipes") {
      prompt += `\n\n## Instructions:\nAnswer the user's question about this recipe. Focus on ingredients, techniques, timing, substitutions, or any other cooking-related aspects they're asking about. Reference specific parts of the recipe when relevant.`;
    } else if (content.path === "posts") {
      prompt += `\n\n## Instructions:\nAnswer the user's question about this blog post. Help them understand the main concepts, key points, or specific details they're asking about. Reference specific sections when relevant.`;
    } else if (content.path === "art") {
      prompt += `\n\n## Instructions:\nAnswer the user's question about this artwork or photography. Discuss the creative process, technical details, inspiration, or story behind the piece as relevant to their question.`;
    } else {
      prompt += `\n\n## Instructions:\nAnswer the user's question about this content. Be helpful and reference specific parts of the content when relevant to their question.`;
    }

    console.log(`[CONTENT_CHAT] Generated prompt length: ${prompt.length} characters`);

    // Get response from Gemini
    const answer = await callGemini(prompt, apiKey);

    // Add links to the response
    const linkedAnswer = addLinksToResponse(answer);

    // Update session
    updateSession(sessionId, content.slug, userMessage, linkedAnswer);

    // Return response
    const response: ContentChatResponse = {
      answer: linkedAnswer,
    };

    console.log(`[CONTENT_CHAT] Response generated for ${content.title}`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Content Chat API error:", err);
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
