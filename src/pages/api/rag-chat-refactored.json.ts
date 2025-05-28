export const prerender = false;

import type { APIRoute } from "astro";
import {
  generateConversationPrompt,
  generateFallbackPrompt,
  type ResponseContext,
  MATTHIAS_FALLBACK_CONTEXT,
} from "../../lib/matthias-bot";
import {
  queryRAG,
  formatRAGContext,
  extractContentSuggestions,
  isPersonalInformationQuery,
  type RAGContext,
} from "../../lib/rag-service";
import {
  validateMessage,
  checkRateLimit,
  cleanupRateLimits,
  type ValidationResult,
} from "../../lib/validation-service";
import { getProfileContent } from "../../lib/pinata";

// Session management
interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface Session {
  messages: ConversationMessage[];
  lastActivity: number;
  enhancedContext?: string;
}

const sessionStore = new Map<string, Session>();
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
const MAX_CONVERSATION_LENGTH = 20;

// Cleanup sessions and rate limits periodically
function cleanupSessions() {
  const now = Date.now();

  for (const [sessionId, session] of sessionStore.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      sessionStore.delete(sessionId);
      console.log(`[CLEANUP] Removed expired session: ${sessionId}`);
    }
  }

  cleanupRateLimits();
  console.log(`[CLEANUP] Active sessions: ${sessionStore.size}`);
}

setInterval(cleanupSessions, CLEANUP_INTERVAL);

// Session helpers
function getSession(sessionId: string): Session {
  let session = sessionStore.get(sessionId);
  if (!session) {
    session = {
      messages: [],
      lastActivity: Date.now(),
    };
    sessionStore.set(sessionId, session);
    console.log(`[SESSION] Created new session: ${sessionId}`);
  }
  return session;
}

function updateSession(sessionId: string, userMessage: string, assistantResponse: string, enhancedContext?: string) {
  const session = getSession(sessionId);

  session.messages.push(
    { role: "user", content: userMessage, timestamp: Date.now() },
    { role: "assistant", content: assistantResponse, timestamp: Date.now() }
  );

  if (session.messages.length > MAX_CONVERSATION_LENGTH) {
    session.messages = session.messages.slice(-MAX_CONVERSATION_LENGTH);
  }

  session.lastActivity = Date.now();
  if (enhancedContext) {
    session.enhancedContext = enhancedContext;
  }

  console.log(`[SESSION] Updated session ${sessionId} - ${session.messages.length} messages`);
}

function buildConversationContext(messages: ConversationMessage[], maxMessages: number = 6): string {
  if (messages.length === 0) return "";

  const recentMessages = messages.slice(-maxMessages);
  const contextLines = recentMessages.map((msg) => {
    const role = msg.role === "user" ? "User" : "Matthias";
    return `${role}: ${msg.content}`;
  });

  return contextLines.join("\n");
}

// Enhanced context retrieval
async function getEnhancedContext(): Promise<string> {
  try {
    const ragResult = await queryRAG({
      message: "Matthias Jordan profile personal information background",
      contentType: "profile",
      maxResults: 1,
    });

    if (ragResult.matches.length > 0) {
      const profileContent = ragResult.matches[0].text;
      console.log("[ENHANCED_CONTEXT] Successfully loaded profile content");
      return profileContent;
    }

    console.log("[ENHANCED_CONTEXT] No profile matches found, using fallback");
    return MATTHIAS_FALLBACK_CONTEXT;
  } catch (error) {
    console.error("[ENHANCED_CONTEXT] Error getting enhanced profile:", error);
    return MATTHIAS_FALLBACK_CONTEXT;
  }
}

// LLM API call
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=" +
    apiKey;
  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
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

// Response interfaces
interface ChatRequest {
  message: string;
  sessionId?: string;
}

interface ChatResponse {
  answer: string;
  context: {
    file_id: string;
    cid: string;
    score: number;
    text: string;
    title?: string;
    slug?: string;
    permalink?: string;
    published?: string;
    updated?: string;
    created?: string;
  }[];
}

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
      console.log(`[RATE_LIMIT] Blocked request from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please wait a moment before asking another question.",
          blocked: true,
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

    const userMessage = body.message.trim();
    const sessionId = body.sessionId || "unknown";

    console.log(`[SESSION] Processing message for session: ${sessionId}`);

    // Validate message content
    console.log(`[VALIDATION] Checking message: "${userMessage}"`);
    const validation = await validateMessage(userMessage, apiKey);
    if (!validation.isValid) {
      console.log(`[VALIDATION] Blocked message - reason: ${validation.reason}`);

      const blockedResponse: ChatResponse = {
        answer: validation.suggestion || "(¬_¬)",
        context: [],
      };

      return new Response(JSON.stringify(blockedResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[VALIDATION] Message passed all validation checks`);

    // Get session and enhanced context
    const session = getSession(sessionId);
    const enhancedContext = await getEnhancedContext();
    const conversationHistory = buildConversationContext(session.messages);

    // Determine if this is a personal information query
    const isPersonalQuery = isPersonalInformationQuery(userMessage);
    console.log(`[QUERY_TYPE] Is personal query: ${isPersonalQuery}`);

    // Query RAG system
    const ragResult = await queryRAG({
      message: userMessage,
      contentType: isPersonalQuery ? "profile" : "content",
      maxResults: 3,
    });

    console.log(`[RAG] Found ${ragResult.matches.length} matches`);

    // Format context for prompt
    const ragContext = formatRAGContext(ragResult.matches, isPersonalQuery);
    const contentSuggestions = extractContentSuggestions(ragResult.matches);

    // Build response context
    const responseContext: ResponseContext = {
      userMessage,
      conversationHistory,
      ragContext: ragContext || undefined,
      enhancedProfile: enhancedContext,
      isPersonalQuery,
      isRecencyQuery: ragResult.isRecencyQuery,
      contentSuggestions: contentSuggestions || undefined,
    };

    // Generate response using Matthias-bot personality
    let prompt: string;
    if (ragContext) {
      prompt = generateConversationPrompt(responseContext);
    } else {
      prompt = generateFallbackPrompt(responseContext);
    }

    console.log(`[PROMPT] Generated prompt length: ${prompt.length} characters`);

    // Get response from LLM
    const answer = await callGemini(prompt, apiKey);

    // Update session
    updateSession(sessionId, userMessage, answer, enhancedContext);

    // Format response
    const response: ChatResponse = {
      answer,
      context: ragResult.matches.map(
        ({ file_id, cid, score, text, title, slug, permalink, published, updated, created }) => ({
          file_id,
          cid,
          score,
          text,
          title,
          slug,
          permalink,
          published,
          updated,
          created,
        })
      ),
    };

    console.log(`[RESPONSE] Final response being sent with ${response.context.length} context items`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("RAG Chat API error:", err);
    return new Response(JSON.stringify({ error: "Failed to process chat request", details: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
