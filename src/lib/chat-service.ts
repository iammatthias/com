// Unified Chat Service - handles both general Q&A and content-specific Q&A
import { pinata, PINATA_VECTOR_GROUP_ID } from "./pinata";

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

function buildConversationContext(messages: Message[], maxMessages: number = 6): string {
  if (messages.length === 0) return "";

  const recentMessages = messages.slice(-maxMessages);
  return recentMessages.map((msg) => `${msg.role === "user" ? "User" : "Matthias"}: ${msg.content}`).join("\n");
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
        suggestion: "(¬_¬)",
      };
    }
  }

  if (message.length > 1000) {
    return {
      isValid: false,
      reason: "message_too_long",
      suggestion: "Please keep your questions concise.",
    };
  }

  return { isValid: true };
}

// Query analysis
function isPersonalQuery(message: string): boolean {
  const personalPatterns =
    /\b(where do you work|what do you do|who are you|about you|your work|your job|your company|social media|contact|email|day---break|tell me about yourself)\b/i;
  return personalPatterns.test(message);
}

function isRecencyQuery(message: string): boolean {
  const recencyPatterns = /\b(latest|recent|newest|last|new|current|updated|lately|recently|2024|2025)\b/i;
  return recencyPatterns.test(message);
}

// RAG search
async function searchContent(message: string): Promise<ChatContext[]> {
  try {
    // Enhance query for recency if needed
    let searchQuery = message;
    if (isRecencyQuery(message)) {
      const currentYear = new Date().getFullYear();
      searchQuery = `${message} ${currentYear} recent newest latest`;
    }

    const result = (await pinata.files.private.queryVectors({
      groupId: PINATA_VECTOR_GROUP_ID,
      query: searchQuery,
      returnFile: false,
    })) as any;

    if (!result.matches || !Array.isArray(result.matches)) {
      return [];
    }

    // Process matches
    const processedMatches: ChatContext[] = [];
    for (const match of result.matches.slice(0, 3)) {
      try {
        let text = "";
        let jsonData: any = {};
        let fileKeyvalues: any = {};

        // Get file metadata
        if (match.file_id) {
          try {
            const fileInfo = await pinata.files.private.get(match.file_id);
            if (fileInfo?.keyvalues) {
              fileKeyvalues = fileInfo.keyvalues;
            }
          } catch (e) {
            console.error(`Failed to get metadata for ${match.file_id}`);
          }
        }

        // Get file content
        if (match.cid) {
          try {
            const fileContent = await pinata.gateways.private.get(match.cid);
            if (fileContent?.data) {
              const contentString =
                typeof fileContent.data === "string" ? fileContent.data : fileContent.data.toString();

              try {
                jsonData = JSON.parse(contentString);
                text = `${jsonData.title || ""} - ${jsonData.excerpt || ""}`.trim();
                if (text.startsWith(" - ")) text = text.substring(3);
              } catch {
                text = contentString;
                if (text.startsWith("---")) {
                  const parts = text.split("---");
                  if (parts.length >= 3) {
                    text = parts.slice(2).join("---").trim();
                  }
                }
              }
            }
          } catch (e) {
            console.error(`Failed to get content for ${match.cid}`);
          }
        }

        processedMatches.push({
          file_id: match.file_id,
          cid: match.cid,
          score: match.score,
          text: text || "Content available",
          title: jsonData.title || fileKeyvalues?.name || "Content",
          slug: jsonData.slug || fileKeyvalues?.slug,
          permalink: jsonData.permalink || fileKeyvalues?.permalink,
          published: jsonData.published || fileKeyvalues?.published,
          updated: jsonData.updated || fileKeyvalues?.updated,
          created: fileKeyvalues?.created || jsonData.created,
        });
      } catch (e) {
        console.error("Error processing match:", e);
      }
    }

    return processedMatches.filter((match) => match.text);
  } catch (error) {
    console.error("Error searching content:", error);
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

  // Search for relevant content
  const contextMatches = await searchContent(message);

  // Build prompt
  const SYSTEM_PROMPT = `You are Matthias Jordan, a photographer turned growth technologist.

## About You:
- You run day---break, a growth engineering consultancy focused on marketing systems and lifecycle automation
- Former photographer who transitioned into growth technology
- You enjoy photography, cooking, building solar-powered computers, and family time
- You live in Southern California with your family
- Your email is matthias@day---break.com

## Your Communication Style:
- Direct and informative (2-3 sentences typically)
- Professional but approachable
- Reference your actual experience when relevant
- If you haven't written about something, say "I haven't written about that"`;

  let prompt = SYSTEM_PROMPT;

  if (conversationContext) {
    prompt += `\n\n## Recent Conversation:\n${conversationContext}`;
  }

  if (contextMatches.length > 0) {
    const isPersonal = isPersonalQuery(message);
    const contextString = contextMatches
      .map((match) => {
        const date = match.created || match.published || "unknown date";
        return `${match.title || "Content"} (${date}): ${match.text}`;
      })
      .join("\n\n");

    if (isPersonal) {
      prompt += `\n\n## Your Personal Information:\n${contextString}`;
    } else {
      prompt += `\n\n## Your Published Content:\n${contextString}`;
    }
  }

  prompt += `\n\n## Current Message:\n"${message}"`;

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

  // Build prompt
  const SYSTEM_PROMPT = `You are continuing a conversation about specific content. Answer questions about the provided content naturally and directly.

## Response Guidelines:
- Answer based on the specific content provided
- Keep responses conversational and concise (2-4 sentences typically)
- Reference relevant parts of the content when helpful`;

  let prompt = SYSTEM_PROMPT;

  if (conversationContext) {
    prompt += `\n\n## Recent Conversation:\n${conversationContext}`;
  }

  const contentType = content.path.slice(0, -1); // Remove 's' from 'posts', 'recipes', etc.
  const formattedDate = new Date(content.created).toLocaleDateString();

  prompt += `\n\n## The ${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Content:`;
  prompt += `\nTitle: ${content.title}`;
  prompt += `\nPublished: ${formattedDate}`;
  if (content.tags?.length > 0) {
    prompt += `\nTags: ${content.tags.join(", ")}`;
  }
  prompt += `\n\nContent:\n${content.body}`;
  prompt += `\n\n## User Question:\n"${message}"`;

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
