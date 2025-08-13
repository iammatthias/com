// Unified Chat Service - handles both general Q&A and content-specific Q&A
import { pinata, PINATA_VECTOR_GROUP_ID } from "./pinata";
import {
  generateGeneralChatPrompt,
  generateContentChatPrompt,
  buildConversationContext,
  isRecencyQuery,
  getValidationResponse,
} from "./matthias-bot";
import { getCollection } from "astro:content";

// Types
export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

export interface ChatContext {
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
  collection?: string;
  path?: string;
}

export interface GeneralChatRequest {
  type: "general";
  message: string;
  sessionId?: string;
}

export interface ContentChatRequest {
  type: "content";
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

export type ChatRequest = GeneralChatRequest | ContentChatRequest;

export interface ChatResponse {
  answer: string;
  context: ChatContext[];
}

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // requests per minute

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(ip);

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userRequests.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userRequests.count++;
  return true;
}

// Session management
interface Session {
  messages: Message[];
  lastActivity: number;
  contentSlug?: string;
}

const sessionStore = new Map<string, Session>();
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
const MAX_CONVERSATION_LENGTH = 20;

export function getSession(sessionId: string, contentSlug?: string): Session {
  let session = sessionStore.get(sessionId);

  if (!session || (contentSlug && session.contentSlug !== contentSlug)) {
    session = {
      messages: [],
      lastActivity: Date.now(),
      contentSlug,
    };
    sessionStore.set(sessionId, session);
  }

  return session;
}

export function updateSession(sessionId: string, userMessage: string, assistantResponse: string, contentSlug?: string) {
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

// Content validation
export function validateMessage(message: string): { isValid: boolean; reason?: string; suggestion?: string } {
  const harmfulPatterns = [
    /ignore.*(previous|above|system|instructions|prompt|context)/i,
    /you are now|act as|pretend to be|roleplay|imagine you are|simulate|behave like/i,
    /override.*(safety|guidelines|rules|instructions|system)/i,
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(message)) {
      return {
        isValid: false,
        reason: "inappropriate_content",
        suggestion: getValidationResponse("inappropriate"),
      };
    }
  }

  if (message.length > 1000) {
    return {
      isValid: false,
      reason: "message_too_long",
      suggestion: getValidationResponse("tooLong"),
    };
  }

  return { isValid: true };
}

// Enhanced query interpretation using LLM
interface QueryIntent {
  contentTypes: string[];
  isRecencyQuery: boolean;
  timeframe?: string; // "recent", "latest", "last_month", etc.
  specificTopics: string[];
  semanticQuery: string; // Cleaned query for vector search
}

async function interpretUserQuery(message: string, apiKey: string): Promise<QueryIntent> {
  const interpretationPrompt = `Analyze this user query and extract their intent:

User query: "${message}"

Return ONLY a valid JSON object with this exact structure:
{
  "contentTypes": ["posts", "recipes", "art", "open-source"],
  "isRecencyQuery": true/false,
  "timeframe": "recent|latest|last_month|last_year",
  "specificTopics": ["topic1", "topic2"],
  "semanticQuery": "cleaned query for semantic search"
}

Guidelines:
- contentTypes: Array of relevant content types. Use all types ["posts", "recipes", "art", "open-source"] if query is general
- isRecencyQuery: true if query asks for recent/latest/new content
- timeframe: specific time indication or omit if not applicable
- specificTopics: extract key topics/subjects from the query
- semanticQuery: the core semantic meaning without recency/content type filters

Examples:
"What's your latest recipe?" → {"contentTypes": ["recipes"], "isRecencyQuery": true, "timeframe": "latest", "specificTopics": ["cooking"], "semanticQuery": "recipe cooking food"}
"Tell me about your photography" → {"contentTypes": ["art"], "isRecencyQuery": false, "specificTopics": ["photography"], "semanticQuery": "photography art visual"}`;

  try {
    const response = await callGemini(interpretationPrompt, apiKey);

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const intent = JSON.parse(jsonMatch[0]);
      console.log(`[QUERY_INTENT] Interpreted:`, intent);
      return intent;
    }

    // Fallback to basic interpretation
    return {
      contentTypes: ["posts", "recipes", "art", "open-source"],
      isRecencyQuery: isRecencyQuery(message),
      timeframe: isRecencyQuery(message) ? "recent" : undefined,
      specificTopics: [],
      semanticQuery: message,
    };
  } catch (error) {
    console.error("Error interpreting query:", error);
    // Fallback to basic interpretation
    return {
      contentTypes: ["posts", "recipes", "art", "open-source"],
      isRecencyQuery: isRecencyQuery(message),
      timeframe: isRecencyQuery(message) ? "recent" : undefined,
      specificTopics: [],
      semanticQuery: message,
    };
  }
}

// Enhanced content search using Astro API + direct CID lookup
async function searchContentWithIntent(intent: QueryIntent): Promise<ChatContext[]> {
  try {
    console.log(`[SEARCH_INTENT] Processing intent:`, intent);

    // Step 1: Get content from Astro API with proper filtering
    const allContent = await getCollection("content");

    // Filter by content types
    let filteredContent = allContent.filter((item) => intent.contentTypes.includes(item.data.path));

    // Apply recency filtering if needed
    if (intent.isRecencyQuery) {
      const now = new Date();
      let cutoffDate = now;

      if (intent.timeframe === "recent" || intent.timeframe === "latest") {
        cutoffDate = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000); // 3 months
      } else if (intent.timeframe === "last_month") {
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 1 month
      } else if (intent.timeframe === "last_year") {
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year
      }

      filteredContent = filteredContent.filter((item) => {
        const itemDate = new Date(item.data.created || item.data.updated || "1970-01-01");
        return itemDate >= cutoffDate;
      });

      // Sort by date (most recent first)
      filteredContent.sort((a, b) => {
        const dateA = new Date(a.data.created || a.data.updated || "1970-01-01").getTime();
        const dateB = new Date(b.data.created || b.data.updated || "1970-01-01").getTime();
        return dateB - dateA;
      });
    }

    console.log(`[SEARCH_INTENT] Filtered to ${filteredContent.length} items by type and recency`);

    // Step 2: If we have a semantic query and CIDs, use vector search on the filtered set
    if (intent.semanticQuery.trim() && filteredContent.length > 0) {
      const contentWithCids = filteredContent.filter((item) => (item.data as any).pinata_cid);

      if (contentWithCids.length > 0) {
        // Use vector search on the pre-filtered content
        const result = (await pinata.files.private.queryVectors({
          groupId: PINATA_VECTOR_GROUP_ID,
          query: intent.semanticQuery,
          returnFile: false,
        })) as any;

        if (result.matches && Array.isArray(result.matches)) {
          // Match vector results with our filtered content
          const matchedContent = result.matches
            .map((match: any) => {
              return contentWithCids.find(
                (item) => (item.data as any).pinata_cid === match.cid || item.data.slug === match.keyvalues?.slug
              );
            })
            .filter(Boolean)
            .slice(0, 5); // Get top 5 semantic matches

          if (matchedContent.length > 0) {
            console.log(`[SEARCH_INTENT] Found ${matchedContent.length} semantic matches`);
            return matchedContent.map((item) => ({
              file_id: "", // Not needed anymore
              cid: (item.data as any).pinata_cid || "",
              score: 1.0,
              text: `${item.data.title} - ${item.data.excerpt || ""}`,
              title: item.data.title,
              slug: item.data.slug,
              permalink: `/${item.data.path}/${item.data.slug}`,
              created: item.data.created,
              updated: item.data.updated,
              published: item.data.published ? item.data.created : undefined,
              collection: item.data.path,
              path: item.data.path,
            }));
          }
        }
      }
    }

    // Step 3: Fallback to date-sorted results from Astro API
    const fallbackContent = filteredContent.slice(0, 3).map((item) => ({
      file_id: "",
      cid: (item.data as any).pinata_cid || "",
      score: 1.0,
      text: `${item.data.title} - ${item.data.excerpt || ""}`,
      title: item.data.title,
      slug: item.data.slug,
      permalink: `/${item.data.path}/${item.data.slug}`,
      created: item.data.created,
      updated: item.data.updated,
      published: item.data.published ? item.data.created : undefined,
      collection: item.data.path,
      path: item.data.path,
    }));

    console.log(`[SEARCH_INTENT] Returning ${fallbackContent.length} date-sorted results`);
    return fallbackContent;
  } catch (error) {
    console.error("Error in content search with intent:", error);
    return [];
  }
}

// LLM call
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=" +
    apiKey;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("Gemini API returned no answer");
  }

  return data.candidates[0].content.parts[0].text;
}

// Main chat processing
export async function processChat(request: ChatRequest, apiKey: string): Promise<ChatResponse> {
  const { message, sessionId = "unknown" } = request;

  // Validate message
  const validation = validateMessage(message);
  if (!validation.isValid) {
    return {
      answer: validation.suggestion || "Please ask a valid question.",
      context: [],
    };
  }

  if (request.type === "content") {
    // Content-specific chat
    return await processContentChat(request, apiKey);
  } else {
    // General RAG chat
    return await processGeneralChat(request, apiKey);
  }
}

async function processGeneralChat(request: GeneralChatRequest, apiKey: string): Promise<ChatResponse> {
  const { message, sessionId = "unknown" } = request;

  // Get session and conversation context
  const session = getSession(sessionId);
  const conversationContext = buildConversationContext(session.messages);

  // Step 1: Interpret user query using LLM
  const intent = await interpretUserQuery(message, apiKey);

  // Step 2: Search for relevant content using interpreted intent
  const contextMatches = await searchContentWithIntent(intent);

  // Build prompt using centralized function
  const prompt = generateGeneralChatPrompt(message, conversationContext, contextMatches);

  // Get response
  const answer = await callGemini(prompt, apiKey);

  // Update session
  updateSession(sessionId, message, answer);

  return {
    answer,
    context: contextMatches,
  };
}

async function processContentChat(request: ContentChatRequest, apiKey: string): Promise<ChatResponse> {
  const { message, content, sessionId = "unknown" } = request;

  // Get session
  const session = getSession(sessionId, content.slug);
  const conversationContext = buildConversationContext(session.messages, 4);

  // Build prompt using centralized function
  const prompt = generateContentChatPrompt(message, content, conversationContext);

  // Get response
  const answer = await callGemini(prompt, apiKey);

  // Update session
  updateSession(sessionId, message, answer, content.slug);

  return {
    answer,
    context: [],
  };
}

// Cleanup function
export function cleanupSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      sessionStore.delete(sessionId);
    }
  }
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
}

// Start cleanup interval
setInterval(cleanupSessions, 10 * 60 * 1000); // 10 minutes
