export const prerender = false;

import type { APIRoute } from "astro";
import { queryPinataVectors } from "../../lib/pinata";
import { pinata } from "../../lib/pinata";
import matter from "gray-matter";
import pLimit from "p-limit";

// Content guardrails and validation
interface ValidationResult {
  isValid: boolean;
  reason?: string;
  suggestion?: string;
}

// Simple rate limiting per IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute

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

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Detect and block inappropriate content
async function validateMessageContent(message: string, apiKey: string): Promise<ValidationResult> {
  // Enhanced pattern-based checks first (fast)
  const harmfulPatterns = [
    // Jailbreak attempts - more comprehensive
    /ignore.*(previous|above|system|instructions|prompt|context)/i,
    /you are now|act as|pretend to be|roleplay|imagine you are|simulate|behave like/i,
    /forget.*(instructions|context|guidelines|rules|system|prompt)/i,
    /override.*(safety|guidelines|rules|instructions|system)/i,
    /\b(jailbreak|prompt.?inject|system.?prompt|admin.?mode|developer.?mode)\b/i,

    // Direct attempts to extract information
    /show.*(prompt|system|instructions|code|config)/i,
    /what.*(prompt|instructions|system|code|api.?key)/i,
    /reveal.*(prompt|system|config|settings)/i,

    // Illegal/harmful content
    /\b(hack|exploit|illegal|steal|pirate|capture|attack|bomb|weapon|drug|violence|kill|murder)\b/i,
    /\b(password|credentials|private|confidential|secret|api.?key|token)\b/i,

    // Off-topic/inappropriate
    /\b(sexual|explicit|nsfw|porn|xxx|nude|naked)\b/i,
    /\b(criminal|terrorism|suicide|self-harm|torture)\b/i,

    // Clearly off-topic for a personal assistant
    /write.*(essay|homework|assignment|paper|thesis|dissertation)/i,
    /solve.*(math|equation|problem|homework|calculus|algebra)/i,
    /translate.*(to|from|into|language)/i,
    /generate.*(code|script|program).*(for|to|that).*(hack|exploit|illegal)/i,
  ];
  // Array of cheeky angry faces for different types of violations
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

  // Check message length (prevent spam/abuse)
  if (message.length > 1000) {
    return {
      isValid: false,
      reason: "message_too_long",
      suggestion: "Please keep your questions concise. What would you like to know about Matthias?",
    };
  }

  // LLM-based validation for nuanced cases
  const validationPrompt = `User message: "${message}"

Is this appropriate for a personal assistant about Matthias (photographer/growth tech)?

VALID or INVALID`;

  try {
    const result = await callGemini(validationPrompt, apiKey);
    const isValid = /^valid$/i.test(result.trim());

    if (!isValid) {
      return {
        isValid: false,
        reason: "inappropriate_content",
        suggestion: randomAngryFace(),
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Content validation error:", error);
    // On validation error, be conservative and allow through with logging
    console.warn(`[VALIDATION] Failed to validate message: "${message}"`);
    return { isValid: true };
  }
}

// Check if query is reasonably on-topic for a personal assistant
function isReasonablyOnTopic(message: string): ValidationResult {
  // Very broad topic categories that could relate to a personal website
  const appropriateTopics = [
    /\b(you|your|matthias|work|job|career|background|experience|bio|about)\b/i,
    /\b(photo|photography|camera|image|art|creative|design)\b/i,
    /\b(tech|technology|code|coding|programming|development|software|web|app)\b/i,
    /\b(recipe|cooking|food|kitchen|meal|cook|bake|eat)\b/i,
    /\b(project|build|made|created|built|working|portfolio)\b/i,
    /\b(growth|marketing|business|startup|company|client)\b/i,
    /\b(travel|family|personal|life|hobby|interest)\b/i,
    /\b(blog|post|article|write|writing|content|note)\b/i,
    /\b(social|media|contact|email|link|follow)\b/i,
    /\b(hello|hi|hey|what|how|where|when|why|tell|show|help)\b/i,
  ];

  const hasRelevantTopic = appropriateTopics.some((pattern) => pattern.test(message));

  if (!hasRelevantTopic && message.length > 20) {
    // For longer messages that don't match any topic, be more restrictive
    return {
      isValid: false,
      reason: "off_topic",
      suggestion:
        "I'm here to help with questions about Matthias and his work. Try asking about his photography, tech projects, recipes, or professional background.",
    };
  }

  return { isValid: true };
}

interface ChatRequest {
  message: string;
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
  // Use Gemini 2.5 Flash Preview
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

// Get enhanced context content from Pinata
async function getEnhancedContext(): Promise<string> {
  try {
    // Query for the enhanced profile vector specifically
    const contextResult = await queryPinataVectors("personal information profile", false, "profile");

    if (contextResult.matches && contextResult.matches.length > 0) {
      const contextMatch = contextResult.matches[0];
      try {
        const { data } = await pinata.gateways.private.get(contextMatch.cid);
        if (data) {
          // Handle both string and object data formats
          if (typeof data === "string") {
            return data;
          } else if (typeof data === "object") {
            // If it's JSON object, convert to readable text
            return JSON.stringify(data, null, 2);
          }
        }
      } catch (err) {
        console.error("Failed to fetch enhanced profile content:", err);
      }
    }

    // Fallback context if enhanced context is not available
    return `I'm Matthias, a photographer turned growth technologist. I run day---break, a marketing consultancy focused on growth and lifecycle automation. I enjoy photography, cooking, building solar-powered computers, and family time.`;
  } catch (error) {
    console.error("Error getting enhanced profile:", error);
    return `I'm Matthias, a photographer turned growth technologist.`;
  }
}

// Utility: Use Gemini to decide if RAG is needed or just conversation
async function shouldRAG(message: string, enhancedContext: string, apiKey: string): Promise<"RAG" | "CONVERSATION"> {
  // Always use RAG for recency queries
  const recencyInfo = isRecencyQuery(message);
  if (recencyInfo.isRecency) {
    console.log(`[ROUTING] Detected recency query, forcing RAG mode`);
    return "RAG";
  }

  // Check for personal information questions
  const personalQuestions =
    /\b(where do you work|what do you do|who are you|about you|your work|your job|your company|social media|are you on|contact|email|your background|your experience|day---break|tell me about yourself)\b/i;
  if (personalQuestions.test(message)) {
    console.log(`[ROUTING] Detected personal information query, forcing RAG mode`);
    return "RAG";
  }

  const routingPrompt = `User: "${message}"

Looking for something specific I've built/written, or just chatting?

RAG or CONVERSATION`;

  const result = await callGemini(routingPrompt, apiKey);
  console.log(`[ROUTING] User message: "${message}"`);
  console.log(`[ROUTING] LLM decision: "${result.trim()}"`);

  if (/^rag$/i.test(result.trim())) return "RAG";
  return "CONVERSATION";
}

// Utility: Check if context matches are relevant to the user's query
async function checkContextRelevance(userMessage: string, contextMatches: any[], apiKey: string): Promise<any[]> {
  if (contextMatches.length === 0) return [];

  const contextTitles = contextMatches.map((match) => match.title || match.slug || "Untitled").join(", ");

  const relevancePrompt = `User: "${userMessage}"
Content: ${contextTitles}

Which content is relevant? List titles or "NONE".`;

  const result = await callGemini(relevancePrompt, apiKey);
  console.log(`[RELEVANCE] User query: "${userMessage}"`);
  console.log(`[RELEVANCE] Available content: ${contextTitles}`);
  console.log(`[RELEVANCE] LLM decision: "${result.trim()}"`);

  if (result.trim().toUpperCase() === "NONE") {
    return [];
  }

  // Filter matches based on LLM relevance decision
  const relevantTitles = result
    .toLowerCase()
    .split(",")
    .map((s) => s.trim());
  const relevantMatches = contextMatches.filter((match) => {
    const title = (match.title || match.slug || "").toLowerCase();
    return relevantTitles.some((relevantTitle) => title.includes(relevantTitle) || relevantTitle.includes(title));
  });

  console.log(`[RELEVANCE] Filtered ${contextMatches.length} -> ${relevantMatches.length} matches`);
  return relevantMatches;
}

// Utility: Detect if user is asking for recent/latest content
function isRecencyQuery(message: string): { isRecency: boolean; contentType?: string; isUpdateQuery?: boolean } {
  const recencyKeywords = /\b(latest|recent|newest|last|new|current|updated)\b/i;
  const isRecency = recencyKeywords.test(message);

  if (!isRecency) return { isRecency: false };

  // Check if specifically asking about updates/changes
  const updateKeywords = /\b(updated|changed|modified|revised|edited)\b/i;
  const isUpdateQuery = updateKeywords.test(message);

  // Extract content type if present - more comprehensive patterns matching the actual paths
  const contentTypePatterns = [
    { pattern: /\b(recipe|recipes|cooking|food|meal|cook|bake)\b/i, type: "recipes" },
    { pattern: /\b(project|projects|work|build|building|development|coding)\b/i, type: "projects" },
    { pattern: /\b(photo|photos|photography|image|images|camera|cameras|gear)\b/i, type: "photography" },
    { pattern: /\b(post|posts|article|articles|blog|writing|write|wrote)\b/i, type: "posts" },
    { pattern: /\b(note|notes|thought|thoughts|update|updates)\b/i, type: "notes" },
    { pattern: /\b(tutorial|tutorials|guide|guides|how-to|how to)\b/i, type: "tutorials" },
    { pattern: /\b(art|artwork|creative|design|painting|drawing)\b/i, type: "art" },
    { pattern: /\b(travel|trip|journey|vacation|adventure)\b/i, type: "travel" },
  ];

  for (const { pattern, type } of contentTypePatterns) {
    if (pattern.test(message)) {
      return { isRecency: true, contentType: type, isUpdateQuery };
    }
  }

  return { isRecency: true, isUpdateQuery };
}

// Utility: Generate optimized search query for recency-focused queries
function getOptimizedSearchQuery(message: string, contentType?: string): string {
  if (contentType) {
    // For content-specific queries, search for the content type with specific terms
    switch (contentType) {
      case "recipes":
        return "recipe cooking food ingredient meal cook bake kitchen";
      case "projects":
        return "project development coding build programming software web app";
      case "photography":
        return "photography photo camera image picture gear equipment";
      case "posts":
        return "blog post article writing content thoughts opinion";
      case "notes":
        return "note thought update reflection personal";
      case "tutorials":
        return "tutorial guide how-to instruction step-by-step learning";
      case "art":
        return "art artwork creative design painting drawing visual";
      case "travel":
        return "travel trip journey vacation adventure location place";
      default:
        return contentType;
    }
  }

  // For general recency queries, use the original message
  return message;
}

// Utility: Filter and prioritize matches by content type (path)
function filterAndPrioritizeByContentType(matches: any[], contentType?: string): any[] {
  if (!contentType || !matches.length) {
    return matches;
  }

  console.log(`[CONTENT_TYPE] Filtering for content type: ${contentType}`);
  console.log(`[CONTENT_TYPE] Total matches to filter: ${matches.length}`);

  // Log all matches with their paths for debugging
  matches.forEach((match, idx) => {
    const matchPath = match.keyvalues?.path || match.path;
    console.log(`[CONTENT_TYPE] Match ${idx + 1}: "${match.title || match.slug}" has path: "${matchPath}"`);
  });

  // Separate matches by content type
  const exactMatches: any[] = [];
  const otherMatches: any[] = [];

  for (const match of matches) {
    const matchPath = match.keyvalues?.path || match.path;

    // Check if this match is from the requested content type
    if (matchPath === contentType) {
      exactMatches.push(match);
      console.log(`[CONTENT_TYPE] ✅ Found exact match: ${match.title || match.slug} (path: ${matchPath})`);
    } else {
      otherMatches.push(match);
      console.log(
        `[CONTENT_TYPE] ❌ Non-matching path: ${match.title || match.slug} (path: ${matchPath}, wanted: ${contentType})`
      );
    }
  }

  // If we found exact matches, prioritize them heavily
  if (exactMatches.length > 0) {
    console.log(`[CONTENT_TYPE] Found ${exactMatches.length} exact matches for content type ${contentType}`);

    // Give exact matches a massive score boost to ensure they appear first
    exactMatches.forEach((match) => {
      const oldScore = match.score || 0;
      match.score = oldScore + 10000000; // Very large boost
      match.contentTypeMatch = true;
      console.log(`[CONTENT_TYPE] Boosted score for ${match.title || match.slug}: ${oldScore} → ${match.score}`);
    });

    // Return exact matches first, then others
    console.log(
      `[CONTENT_TYPE] Returning ${exactMatches.length} exact matches first, then ${otherMatches.length} others`
    );
    return [...exactMatches, ...otherMatches];
  } else {
    console.log(`[CONTENT_TYPE] ⚠️  No exact matches found for content type ${contentType}, using all matches`);
    console.log(
      `[CONTENT_TYPE] Available paths in results: ${matches
        .map((m) => m.keyvalues?.path || m.path || "no-path")
        .join(", ")}`
    );
    return matches;
  }
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

    // Content validation - check for inappropriate content and jailbreak attempts
    console.log(`[VALIDATION] Checking message: "${userMessage}"`);
    const contentValidation = await validateMessageContent(userMessage, apiKey);
    if (!contentValidation.isValid) {
      console.log(`[VALIDATION] Blocked message - reason: ${contentValidation.reason}`);

      // Add processing delay to simulate realistic thinking time (0.5-1.5 seconds for validation)
      const validationDelay = Math.floor(Math.random() * 1000) + 500; // 500-1500ms
      console.log(`[PROCESSING] Adding ${validationDelay}ms delay for validation response`);
      await new Promise((resolve) => setTimeout(resolve, validationDelay));

      // Return as normal chat response with angry faces instead of error
      const angryResponse: ChatResponse = {
        answer: contentValidation.suggestion || "(¬_¬)",
        context: [],
      };

      return new Response(JSON.stringify(angryResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Topic relevance check
    const topicValidation = isReasonablyOnTopic(userMessage);
    if (!topicValidation.isValid) {
      console.log(`[VALIDATION] Off-topic message - reason: ${topicValidation.reason}`);

      // Add processing delay to simulate realistic thinking time (0.5-1.5 seconds for validation)
      const validationDelay = Math.floor(Math.random() * 1000) + 500; // 500-1500ms
      console.log(`[PROCESSING] Adding ${validationDelay}ms delay for validation response`);
      await new Promise((resolve) => setTimeout(resolve, validationDelay));

      // Return as normal chat response with angry faces instead of error
      const angryResponse: ChatResponse = {
        answer: topicValidation.suggestion || "(¬_¬)",
        context: [],
      };

      return new Response(JSON.stringify(angryResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[VALIDATION] Message passed all validation checks`);

    // Get enhanced context upfront for both routing and response
    let enhancedContext = "";
    try {
      enhancedContext = await getEnhancedContext();
    } catch (error) {
      console.error("Failed to retrieve enhanced context:", error);
    }

    // All responses will be conversational and concise
    console.log(`[RESPONSE] Using simplified conversational approach`);

    // Check if this is a personal information query
    const personalQuestions =
      /\b(where do you work|what do you do|who are you|about you|your work|your job|your company|social media|are you on|contact|email|your background|your experience|day---break|tell me about yourself)\b/i;
    const isPersonalQuery = personalQuestions.test(userMessage);

    // Check if this is a recency-focused query
    const recencyInfo = isRecencyQuery(userMessage);
    console.log(`[RECENCY] Query analysis:`, recencyInfo);

    // Log current date context for recency debugging
    const currentDate = new Date();
    const currentDateString = currentDate.toISOString().split("T")[0];
    console.log(`[RECENCY] Current date: ${currentDateString} (${currentDate.toLocaleDateString()})`);
    console.log(`[RECENCY] Current timestamp: ${currentDate.getTime()}`);

    // Optimize search query for recency-focused queries
    const searchQuery = recencyInfo.isRecency
      ? getOptimizedSearchQuery(userMessage, recencyInfo.contentType)
      : userMessage;

    console.log(`[SEARCH] Original query: "${userMessage}"`);
    console.log(`[SEARCH] Optimized query: "${searchQuery}"`);
    console.log(`[SEARCH] Is personal query: ${isPersonalQuery}`);

    // Query appropriate data source based on query type
    let pinataResult;
    if (isPersonalQuery) {
      // For personal questions, search profile data
      console.log(`[PERSONAL] Searching profile data for personal information`);
      pinataResult = await queryPinataVectors(searchQuery, false, "profile", false);
    } else {
      // For other questions, search content data with recency context if it's a recency query
      const useRecencyContext = recencyInfo.isRecency;
      console.log(`[CONTENT] Searching content data, recency context: ${useRecencyContext}`);
      pinataResult = await queryPinataVectors(searchQuery, false, "content", useRecencyContext);
    }
    console.log(`[PINATA] Query: "${searchQuery}"`);
    console.log(`[PINATA] Raw result:`, pinataResult);

    // Process all matches to get metadata, then sort by recency
    let allMatches: {
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
    }[] = [];

    if (pinataResult.matches && Array.isArray(pinataResult.matches)) {
      console.log(`[CONTEXT] Processing ${pinataResult.matches.length} matches`);

      // Use p-limit for concurrent processing of matches
      const limit = pLimit(3);
      const matchProcessingPromises = pinataResult.matches.map((match) =>
        limit(async () => {
          let text = "";
          let jsonData: any = {};
          try {
            const { data } = await pinata.gateways.private.get(match.cid);
            if (data) {
              // Handle profile data differently from content data
              if (isPersonalQuery && (match.keyvalues?.type === "profile" || match.name?.includes("profile"))) {
                // For profile data, use the raw text content
                text = typeof data === "string" ? data : String(data);
                jsonData = {
                  title: "Personal Profile",
                  type: "profile",
                };
              } else {
                // Handle content data (original logic)
                if (typeof data === "object" && data !== null && !Array.isArray(data)) {
                  // Data is already a JSON object
                  jsonData = data;
                  text = `${jsonData.title || ""} - ${jsonData.excerpt || ""}`.trim();
                  // Remove leading dash if title is empty
                  if (text.startsWith(" - ")) {
                    text = text.substring(3);
                  }
                } else {
                  // Handle string data (old format)
                  const dataString = typeof data === "string" ? data : String(data);
                  try {
                    // Try to parse as JSON first
                    jsonData = JSON.parse(dataString);
                    text = `${jsonData.title || ""} - ${jsonData.excerpt || ""}`.trim();
                    if (text.startsWith(" - ")) {
                      text = text.substring(3);
                    }
                  } catch (e) {
                    // Fallback to frontmatter parsing for old text format
                    text = dataString;
                    try {
                      const parsed = matter(text);
                      if (parsed && parsed.data && Object.keys(parsed.data).length > 0) {
                        jsonData = parsed.data;
                        text = parsed.content.trim();
                      }
                    } catch (e2) {
                      // Not frontmatter, use as is
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.log(`[CONTEXT] Failed to fetch content for CID ${match.cid}:`, e);
            // Return null for failed fetches to filter out later
            return null;
          }

          const processedMatch = {
            ...match,
            text,
            title: jsonData.title || match.keyvalues?.name,
            slug: jsonData.slug || match.keyvalues?.slug,
            permalink:
              jsonData.permalink ||
              match.keyvalues?.permalink ||
              (jsonData.path && jsonData.slug
                ? `/${jsonData.path}/${jsonData.slug}`
                : match.keyvalues?.path && match.keyvalues?.slug
                ? `/${match.keyvalues.path}/${match.keyvalues.slug}`
                : undefined),
            published: jsonData.published || match.keyvalues?.published,
            updated: jsonData.updated || match.keyvalues?.updated,
            // Always prioritize created date from Pinata key-values first
            created: match.keyvalues?.created || jsonData.created || match.keyvalues?.published || jsonData.published,
          };
          console.log(`[CONTEXT] Processed match:`, processedMatch);
          return processedMatch;
        })
      );

      // Wait for all matches to be processed and filter out failed ones
      const processedMatches = await Promise.all(matchProcessingPromises);
      allMatches = processedMatches.filter((match): match is NonNullable<typeof match> => match !== null);

      // Apply content type filtering and prioritization for content-specific queries
      if (recencyInfo.contentType) {
        allMatches = filterAndPrioritizeByContentType(allMatches, recencyInfo.contentType);
      }

      // Sort with strong recency bias ALWAYS - prioritize created date from Pinata key-values
      allMatches.sort((a, b) => {
        // Get current date for accurate age calculations
        const now = Date.now();

        // Always use created date from Pinata key-values as primary sort criteria
        // Fallback order: created (KV) -> created (JSON) -> published (KV) -> published (JSON)
        const getCreatedDate = (match: any): number => {
          // Prioritize created date from Pinata key-values
          if (match.created) {
            const date = new Date(match.created).getTime();
            if (!isNaN(date)) return date;
          }
          // Fallback to published if no valid created date
          if (match.published) {
            const date = new Date(match.published).getTime();
            if (!isNaN(date)) return date;
          }
          // Ultimate fallback
          return new Date("1970-01-01").getTime();
        };

        const dateA = getCreatedDate(a);
        const dateB = getCreatedDate(b);

        // Calculate age in days for more precise recency handling
        const dayMs = 24 * 60 * 60 * 1000;
        const ageInDaysA = (now - dateA) / dayMs;
        const ageInDaysB = (now - dateB) / dayMs;

        console.log(
          `[SORTING] Match A: ${a.title || a.slug} - Created: ${a.created || "none"} - Age: ${ageInDaysA.toFixed(
            1
          )} days`
        );
        console.log(
          `[SORTING] Match B: ${b.title || b.slug} - Created: ${b.created || "none"} - Age: ${ageInDaysB.toFixed(
            1
          )} days`
        );

        // For explicit recency queries, sort purely by created date (newest first)
        if (recencyInfo.isRecency) {
          if (dateA !== dateB) {
            return dateB - dateA;
          }
          // If dates are equal, use score as tiebreaker
          return (b.score || 0) - (a.score || 0);
        }

        // For ALL other queries, apply enhanced recency bias with current date awareness
        // Apply tiered recency scoring based on age with more granular tiers
        const getRecencyBoost = (ageInDays: number): number => {
          if (ageInDays < 1) return 2000000; // Today - massive boost
          if (ageInDays < 3) return 1500000; // Last 3 days - huge boost
          if (ageInDays < 7) return 1000000; // Last week - very large boost
          if (ageInDays < 14) return 750000; // Last 2 weeks - large boost
          if (ageInDays < 30) return 500000; // Last month - medium-large boost
          if (ageInDays < 60) return 300000; // Last 2 months - medium boost
          if (ageInDays < 90) return 200000; // Last quarter - small-medium boost
          if (ageInDays < 180) return 100000; // Last 6 months - small boost
          if (ageInDays < 365) return 50000; // Last year - tiny boost
          return 0; // Older - no boost
        };

        const recencyBoostA = getRecencyBoost(ageInDaysA);
        const recencyBoostB = getRecencyBoost(ageInDaysB);

        const finalScoreA = (a.score || 0) + recencyBoostA;
        const finalScoreB = (b.score || 0) + recencyBoostB;

        console.log(
          `[SORTING] Match A final score: ${finalScoreA} (base: ${
            a.score
          }, recency: ${recencyBoostA}, age: ${ageInDaysA.toFixed(1)} days)`
        );
        console.log(
          `[SORTING] Match B final score: ${finalScoreB} (base: ${
            b.score
          }, recency: ${recencyBoostB}, age: ${ageInDaysB.toFixed(1)} days)`
        );

        // If final scores are very close, prioritize recency
        if (Math.abs(finalScoreA - finalScoreB) < 10000) {
          return dateB - dateA;
        }

        return finalScoreB - finalScoreA;
      });
    }

    // Take top 3 matches after sorting
    const contextMatches = allMatches.slice(0, 3);
    console.log(`[CONTEXT] Final context matches (top 3):`, contextMatches);

    // For recency queries, log additional information
    if (recencyInfo.isRecency) {
      console.log(`[RECENCY] Content type: ${recencyInfo.contentType || "general"}`);
      console.log(`[RECENCY] Query type: ${recencyInfo.isUpdateQuery ? "updates" : "creation dates"}`);
      // Always show created date from Pinata key-values first
      const topMatchDate = contextMatches[0]?.created || contextMatches[0]?.published || "no date";
      console.log(`[RECENCY] Top match date: ${topMatchDate}`);
      if (contextMatches.length > 0) {
        contextMatches.forEach((match, index) => {
          // Show created date from Pinata key-values as primary
          const matchDate = match.created || match.published || "no date";
          const source = match.created ? "created" : match.published ? "published" : "none";
          console.log(
            `[RECENCY] Match ${index + 1}: ${match.title || match.slug} (${matchDate} from ${source}) - Score: ${
              match.score
            }`
          );
        });
      }
    }

    // Log sorting results for all queries to verify recency bias
    console.log(`[RECENCY_BIAS] Final sorted matches (showing recency priority):`);
    console.log(`[RECENCY_BIAS] Current date: ${currentDateString} for age calculations`);
    contextMatches.forEach((match, index) => {
      const createdDate = match.created || "no date";
      let age = "unknown";
      let ageDescription = "";

      if (match.created) {
        const ageInMs = currentDate.getTime() - new Date(match.created).getTime();
        const ageInDays = Math.round(ageInMs / (24 * 60 * 60 * 1000));
        age = `${ageInDays}`;

        // Add descriptive age categories
        if (ageInDays < 1) ageDescription = " (today!)";
        else if (ageInDays < 3) ageDescription = " (very recent)";
        else if (ageInDays < 7) ageDescription = " (this week)";
        else if (ageInDays < 14) ageDescription = " (last 2 weeks)";
        else if (ageInDays < 30) ageDescription = " (this month)";
        else if (ageInDays < 90) ageDescription = " (this quarter)";
        else if (ageInDays < 365) ageDescription = " (this year)";
        else ageDescription = " (older)";
      }

      console.log(
        `[RECENCY_BIAS] ${index + 1}. ${
          match.title || match.slug
        } - Created: ${createdDate} (${age} days ago${ageDescription}) - Score: ${match.score}`
      );
    });

    // --- LLM-driven Routing: Should we RAG or just converse? ---
    const route = await shouldRAG(userMessage, enhancedContext, apiKey);
    console.log(`[ROUTING] Final decision: ${route}`);

    if (route === "CONVERSATION") {
      // Dynamically surface relevant content from context if available
      let contextSuggestions = "";
      if (contextMatches.length > 0) {
        // First check if any context is actually relevant to the user's query
        const relevantMatches = await checkContextRelevance(userMessage, contextMatches, apiKey);

        if (relevantMatches.length > 0) {
          // Extract up to 3 unique titles or slugs from relevant context
          const suggestions: string[] = [];
          for (const match of relevantMatches) {
            if (match?.title && !suggestions.includes(match.title)) {
              suggestions.push(match.title);
            } else if (match?.slug && !suggestions.includes(match.slug)) {
              suggestions.push(match.slug);
            }
            if (suggestions.length >= 3) break;
          }
          if (suggestions.length > 0) {
            contextSuggestions = `You might be interested in: ${suggestions.join(", ")}.`;
          }
        }
      }

      // Use enhanced context for conversation mode
      const convoPrompt = `You're Matthias. Talk like you do on Warpcast - conversational, practical, curious.

${enhancedContext}

User: "${userMessage}"

${contextSuggestions ? `Related content: ${contextSuggestions}` : ""}

Keep it short and helpful. Ask what they're actually trying to build if it's not clear. Max 150 words.`;

      const answer = await callGemini(convoPrompt, apiKey);
      const response: ChatResponse = {
        answer,
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
      console.log(`[RESPONSE] Final response being sent:`, response);
      console.log(`[RESPONSE] Context length: ${response.context.length}`);

      // Add processing delay to simulate realistic thinking time (1-3 seconds)
      const processingDelay = Math.floor(Math.random() * 2000) + 1000; // 1000-3000ms
      console.log(`[PROCESSING] Adding ${processingDelay}ms delay to simulate processing`);
      await new Promise((resolve) => setTimeout(resolve, processingDelay));

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use context for RAG response
    let answer: string;
    if (contextMatches.length > 0) {
      // Handle personal queries differently
      if (isPersonalQuery) {
        // For personal queries, use context data directly
        const contextString = contextMatches.map((c) => c.text).join("\n\n");

        const personalPrompt = `You're Matthias responding based on your personal info.

Personal Context:
${contextString}

User: "${userMessage}"

Answer conversationally like you're explaining to a friend. Keep it under 150 words. Use "you can just..." for simple solutions.`;

        answer = await callGemini(personalPrompt, apiKey);
      } else {
        // Original logic for content queries
        const contextString = contextMatches
          .map((c, i) => {
            // Always prioritize created date for recency
            const createdDate = c.created || c.published || "unknown date";
            const isRecent = c.created && new Date(c.created).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000; // Last 30 days
            const recencyMarker = isRecent ? " (recent)" : "";
            return `${c.title || "Post"} (${createdDate}${recencyMarker}): ${c.text}`;
          })
          .join("\n\n");

        // Build prompt with recency awareness
        let recencyNote = "";
        if (recencyInfo.isRecency) {
          recencyNote = `\n\nNote: Content sorted by recency (newest first based on created date). Focus on the most recent items.`;
        }

        const prompt = `You're Matthias responding based on your content.

Relevant posts: ${contextString}${recencyNote}

User: "${userMessage}"

Answer based on what you've actually built. If it's simple, start with "you can just..." and explain briefly. Ask follow-ups if they need specifics. Max 150 words.`;

        answer = await callGemini(prompt, apiKey);
      }
    } else {
      // No relevant published information found
      const fallbackPrompt = `User: "${userMessage}"

Haven't written about this specifically. What are you trying to build?`;

      answer = await callGemini(fallbackPrompt, apiKey);
    }
    // Pass context metadata to frontend
    const response: ChatResponse = {
      answer,
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
    console.log(`[RESPONSE] Final response being sent:`, response);
    console.log(`[RESPONSE] Context length: ${response.context.length}`);

    // Add processing delay to simulate realistic thinking time (1-3 seconds)
    const processingDelay = Math.floor(Math.random() * 2000) + 1000; // 1000-3000ms
    console.log(`[PROCESSING] Adding ${processingDelay}ms delay to simulate processing`);
    await new Promise((resolve) => setTimeout(resolve, processingDelay));

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
