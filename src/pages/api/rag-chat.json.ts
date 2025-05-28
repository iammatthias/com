export const prerender = false;

import type { APIRoute } from "astro";
import { pinata, PINATA_VECTOR_GROUP_ID } from "../../lib/pinata";
import { addLinksToResponse } from "../../lib/chat-links";

// Core system prompt that defines Matthias
const MATTHIAS_SYSTEM_PROMPT = `You are Matthias Jordan, a photographer turned growth technologist.

## About You:
- You run day---break, a growth engineering consultancy focused on marketing systems and lifecycle automation
- Former photographer who transitioned into growth technology
- You enjoy photography, cooking, building solar-powered computers, and family time
- You live in Southern California with your family
- You're active on Warpcast (Farcaster), Glass (photography), GitHub, and LinkedIn
- Your email is matthias@day---break.com

## Your Work:
- You architect marketing systems that treat customers like humans, not data points
- You consistently deliver 40%+ improvements in key metrics across diverse industries
- You've worked at companies like Ice Barrel, Revance, Tornado, Aspiration, and Surf Air
- You focus on: marketing automation, data architecture, conversion optimization, customer lifecycle engineering

## Your Communication Style:
- Direct and informative (2-3 sentences typically)
- Professional but approachable
- You reference your actual experience and published content when relevant
- If you haven't written about something, you say "I haven't written about that" or "That's not something I've shared publicly"
- You don't make up information about your experience

## Response Guidelines:
- Answer based on your knowledge and any relevant published content provided
- Reference previous conversation only when directly relevant
- Stay focused on the user's question
- Provide helpful, accurate information aligned with your actual experience`;

// Simple rate limiting per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute

// Session storage for conversation context
const sessionStore = new Map<
  string,
  {
    messages: Array<{ role: "user" | "assistant"; content: string; timestamp?: number }>;
    lastActivity: number;
  }
>();

const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
const MAX_CONVERSATION_LENGTH = 20;

function cleanupSessions() {
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

setInterval(cleanupSessions, CLEANUP_INTERVAL);

function checkRateLimit(ip: string): boolean {
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

function getSession(sessionId: string) {
  let session = sessionStore.get(sessionId);
  if (!session) {
    session = { messages: [], lastActivity: Date.now() };
    sessionStore.set(sessionId, session);
  }
  return session;
}

function updateSession(sessionId: string, userMessage: string, assistantResponse: string) {
  const session = getSession(sessionId);
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
  maxMessages: number = 6
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
    /\b(jailbreak|prompt.?inject|system.?prompt|admin.?mode|developer.?mode)\b/i,
    /from now on|starting now|new instructions|new directive|new role/i,
    /disregard.*(previous|above|prior|earlier)/i,
    /instead.*(respond|answer|act|behave)/i,
    /your.*(new|real|actual|true).*(purpose|role|function|job)/i,
    /show.*(prompt|system|instructions|code|config)/i,
    /what.*(prompt|instructions|system|code|api.?key)/i,
    /reveal.*(prompt|system|config|settings)/i,
    /repeat.*(instructions|prompt|system)/i,
    /\b(hack|exploit|illegal|steal|pirate|capture|attack|bomb|weapon|drug|violence|kill|murder)\b/i,
    /\b(password|credentials|private|confidential|secret|api.?key|token)\b/i,
    /\b(sexual|explicit|nsfw|porn|xxx|nude|naked)\b/i,
    /\b(criminal|terrorism|suicide|self-harm|torture)\b/i,
  ];

  const angryFaces = ["(¬_¬)", "( ꒪Д꒪)", "(ಠ_ಠ)"];
  const randomAngryFace = () => angryFaces[Math.floor(Math.random() * angryFaces.length)];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(message)) {
      return {
        isValid: false,
        reason: "inappropriate_content",
        suggestion: randomAngryFace(),
      };
    }
  }

  if (message.length > 1000) {
    return {
      isValid: false,
      reason: "message_too_long",
      suggestion: "Please keep your questions concise. What would you like to know about Matthias?",
    };
  }

  return { isValid: true };
}

// Simple query analysis - just determine if it's personal info or content
function isPersonalQuery(message: string): boolean {
  const personalPatterns =
    /\b(where do you work|what do you do|who are you|about you|your work|your job|your company|social media|are you on|contact|email|your background|your experience|day---break|tell me about yourself)\b/i;
  return personalPatterns.test(message);
}

// Check if query mentions recency
function isRecencyQuery(message: string): boolean {
  const recencyPatterns =
    /\b(latest|recent|newest|last|new|current|updated|lately|recently|just|fresh|modern|today|this year|2024|2025)\b/i;
  const timePatterns = /\b(what have you been|what are you|what's new|any new|any recent)\b/i;
  return recencyPatterns.test(message) || timePatterns.test(message);
}

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
          blocked: true,
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

    const body = await request.json();
    if (!body || typeof body.message !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid 'message' in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userMessage = body.message.trim();
    const sessionId = body.sessionId || "unknown";

    // Content validation
    const validation = validateMessageContent(userMessage);
    if (!validation.isValid) {
      const blockedResponse: ChatResponse = {
        answer: validation.suggestion || "(¬_¬)",
        context: [],
      };
      return new Response(JSON.stringify(blockedResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get session and conversation context
    const session = getSession(sessionId);
    const conversationContext = buildConversationContext(session.messages);

    // Determine search strategy
    const isPersonal = isPersonalQuery(userMessage);
    const isRecency = isRecencyQuery(userMessage);

    console.log(`[SEARCH] Personal query: ${isPersonal}, Recency query: ${isRecency}`);

    // Search for relevant content using direct Pinata SDK call
    let contextMatches: any[] = [];

    try {
      console.log(`[SEARCH] Searching for: "${userMessage}"`);

      // Enhance query with temporal context for recency queries
      let enhancedQuery = userMessage;
      if (isRecency) {
        const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
        const currentYear = new Date().getFullYear();

        // Add temporal context that's more specific to the query type
        if (userMessage.toLowerCase().includes("recipe")) {
          enhancedQuery = `${userMessage} recipe cooking food ${currentYear} 2025 newest most recent created`;
        } else {
          enhancedQuery = `${userMessage} current date ${currentDate} year ${currentYear} recent newest latest 2025`;
        }
        console.log(`[SEARCH] Enhanced recency query: "${enhancedQuery}"`);
      }

      // Use direct Pinata SDK call that we know works
      const result = (await pinata.files.private.queryVectors({
        groupId: PINATA_VECTOR_GROUP_ID,
        query: enhancedQuery,
        returnFile: false, // Fixed: returnFile: true causes 0 results
      })) as any;

      console.log(`[SEARCH] Raw matches returned: ${result?.matches?.length || 0}`);

      if (result.matches && Array.isArray(result.matches)) {
        // For recency queries, get more matches to have better candidates for recency weighting
        const matchCount = isRecency ? 10 : 3;
        contextMatches = result.matches.slice(0, matchCount);
        console.log(`[SEARCH] Using ${contextMatches.length} matches (recency: ${isRecency})`);
      }

      // Process the matches and fetch content separately
      const processedMatches: any[] = [];

      for (const match of contextMatches) {
        try {
          let text = "";
          let jsonData: any = {};
          let fileKeyvalues: any = {};

          // Fetch file metadata to get keyvalues
          if (match.file_id) {
            try {
              const fileInfo = await pinata.files.private.get(match.file_id);
              if (fileInfo && fileInfo.keyvalues) {
                fileKeyvalues = fileInfo.keyvalues;
              }
            } catch (metaError) {
              console.error(`[SEARCH] Failed to fetch metadata for file ${match.file_id}:`, metaError);
            }
          }

          // Fetch file content using CID since returnFile: false
          if (match.cid) {
            try {
              const fileContent = await pinata.gateways.private.get(match.cid);
              if (fileContent && fileContent.data) {
                const contentString =
                  typeof fileContent.data === "string" ? fileContent.data : fileContent.data.toString();

                // Try to parse as JSON first (for newer entries)
                try {
                  jsonData = JSON.parse(contentString);
                  text = `${jsonData.title || ""} - ${jsonData.excerpt || ""}`.trim();
                  if (text.startsWith(" - ")) text = text.substring(3);
                } catch {
                  // If not JSON, treat as markdown with frontmatter
                  text = contentString;
                  if (text.startsWith("---")) {
                    const parts = text.split("---");
                    if (parts.length >= 3) {
                      text = parts.slice(2).join("---").trim(); // Get content after frontmatter
                    }
                  }
                }
              }
            } catch (fetchError) {
              console.error(`[SEARCH] Failed to fetch content for CID ${match.cid}:`, fetchError);
              text = "Content available but could not be retrieved";
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
        } catch (error) {
          console.error(`[SEARCH] Error processing match:`, error);
        }
      }

      // Apply recency-aware sorting
      let sortedMatches = processedMatches.filter((match) => match.text);

      if (isRecency || sortedMatches.length > 1) {
        sortedMatches = sortedMatches.sort((a, b) => {
          // Parse dates for comparison - prioritize created date for true content age
          const getDate = (match: any) => {
            const dateStr = match.created || match.published; // Don't use updated date
            if (!dateStr) return new Date(0); // Very old date for items without dates

            // Handle different date formats
            if (dateStr.includes("-") && dateStr.length >= 10) {
              return new Date(dateStr);
            }
            // Handle timestamp format
            if (/^\d+$/.test(dateStr)) {
              return new Date(parseInt(dateStr));
            }
            return new Date(dateStr);
          };

          const dateA = getDate(a);
          const dateB = getDate(b);

          if (isRecency) {
            // For recency queries, heavily weight newer content
            const recencyWeight = 0.8; // 80% weight on recency for "latest" queries
            const scoreWeight = 0.2; // 20% weight on relevance score

            // Calculate days since creation (more intuitive than timestamp normalization)
            const now = Date.now();
            const daysSinceA = Math.max(0, (now - dateA.getTime()) / (1000 * 60 * 60 * 24));
            const daysSinceB = Math.max(0, (now - dateB.getTime()) / (1000 * 60 * 60 * 24));

            // Recency score: newer content gets higher score (exponential decay)
            // Content from today = 1.0, content from 1 year ago ≈ 0.37, content from 2 years ago ≈ 0.14
            const recencyScoreA = Math.exp(-daysSinceA / 365);
            const recencyScoreB = Math.exp(-daysSinceB / 365);

            const combinedScoreA = recencyWeight * recencyScoreA + scoreWeight * a.score;
            const combinedScoreB = recencyWeight * recencyScoreB + scoreWeight * b.score;

            return combinedScoreB - combinedScoreA; // Higher combined score first
          } else {
            // For non-recency queries, use a lighter recency boost
            const recencyWeight = 0.15; // 15% weight on recency
            const scoreWeight = 0.85; // 85% weight on relevance score

            // Smaller recency boost for general queries
            const daysSinceA = Math.max(0, (Date.now() - dateA.getTime()) / (1000 * 60 * 60 * 24));
            const daysSinceB = Math.max(0, (Date.now() - dateB.getTime()) / (1000 * 60 * 60 * 24));

            // Gentler recency boost that fades over 2 years
            const recencyBoostA = Math.exp(-daysSinceA / 730); // 730 days = 2 years
            const recencyBoostB = Math.exp(-daysSinceB / 730);

            const combinedScoreA = scoreWeight * a.score + recencyWeight * recencyBoostA;
            const combinedScoreB = scoreWeight * b.score + recencyWeight * recencyBoostB;

            return combinedScoreB - combinedScoreA;
          }
        });

        // Log the final sorted results instead of every comparison
        if (isRecency && sortedMatches.length > 0) {
          console.log(`[RECENCY] Applied heavy recency weighting to ${sortedMatches.length} matches`);
          sortedMatches.forEach((match, index) => {
            const dateStr = match.created || match.published || "no date";
            const date = new Date(dateStr);
            const daysAgo = Math.max(0, (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
            const recencyScore = Math.exp(-daysAgo / 365);
            const combinedScore = 0.8 * recencyScore + 0.2 * match.score;
            console.log(
              `[RECENCY] ${index + 1}. ${match.title}: ${daysAgo.toFixed(0)} days ago, recency=${recencyScore.toFixed(
                3
              )}, combined=${combinedScore.toFixed(3)}`
            );
          });
        } else {
          console.log(
            `[RECENCY] Applied ${isRecency ? "heavy" : "light"} recency weighting to ${sortedMatches.length} matches`
          );
        }

        if (sortedMatches.length > 0) {
          console.log(
            `[RECENCY] Top match: ${sortedMatches[0].title} (${
              sortedMatches[0].created || sortedMatches[0].updated || "no date"
            })`
          );
        }
      }

      contextMatches = sortedMatches.slice(0, 3); // Take top 3 after sorting

      console.log(`[CONTEXT] Final processed matches: ${contextMatches.length}`);
    } catch (error) {
      console.error("[SEARCH] Error searching for context:", error);
    }

    // Build the prompt
    let prompt = MATTHIAS_SYSTEM_PROMPT;

    // Add conversation history if available
    if (conversationContext) {
      prompt += `\n\n## Recent Conversation:\n${conversationContext}`;
    }

    // Add relevant content if found
    if (contextMatches.length > 0) {
      const contextString = contextMatches
        .map((match) => {
          const date = match.created || match.published || "unknown date";
          return `${match.title || "Content"} (${date}): ${match.text}`;
        })
        .join("\n\n");

      if (isPersonal) {
        prompt += `\n\n## Your Personal Information (use this to answer):\n${contextString}`;
      } else {
        prompt += `\n\n## Your Published Content (reference when relevant):\n${contextString}`;
      }
    }

    // Add the current user message
    prompt += `\n\n## Current Message:\n"${userMessage}"`;

    // Add specific instructions
    if (isPersonal) {
      prompt += `\n\n## Instructions:\nAnswer about your personal background and work based on the information above. Include specific details when relevant. If something isn't covered, say you haven't shared that publicly.`;
    } else if (contextMatches.length > 0) {
      prompt += `\n\n## Instructions:\nAnswer based on your published content above. Reference specific projects, recipes, or posts when relevant. If the topic isn't covered in your content, say you haven't written about it.`;
    } else {
      prompt += `\n\n## Instructions:\nYou don't have specific published content about this topic. Acknowledge that directly and provide any relevant general information from your background if applicable. Don't make up information.`;
    }

    console.log(`[PROMPT] Generated prompt length: ${prompt.length} characters`);

    // Get response from Gemini
    const answer = await callGemini(prompt, apiKey);

    // Add links to the response
    const linkedAnswer = addLinksToResponse(answer);

    // Update session
    updateSession(sessionId, userMessage, linkedAnswer);

    // Return response
    const response: ChatResponse = {
      answer: linkedAnswer,
      context: contextMatches.map(
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

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("RAG Chat API error:", err);
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
