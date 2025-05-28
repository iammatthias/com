/**
 * RAG Service: Pure information retrieval functionality
 * This module handles querying Pinata vectors and processing context,
 * separate from personality and conversation logic.
 */

import { queryPinataVectors } from "./pinata";

export interface RAGContext {
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
  path?: string;
}

export interface RAGQuery {
  message: string;
  contentType?: "profile" | "content";
  useRecencyContext?: boolean;
  maxResults?: number;
}

export interface RAGResult {
  matches: RAGContext[];
  query: string;
  contentType?: string;
  isRecencyQuery: boolean;
}

/**
 * Detect if user is asking for recent/latest content
 */
export function analyzeRecencyQuery(message: string): {
  isRecency: boolean;
  contentType?: string;
  isUpdateQuery?: boolean;
} {
  const recencyKeywords = /\b(latest|recent|newest|last|new|current|updated)\b/i;
  const isRecency = recencyKeywords.test(message);

  if (!isRecency) return { isRecency: false };

  // Check if specifically asking about updates/changes
  const updateKeywords = /\b(updated|changed|modified|revised|edited)\b/i;
  const isUpdateQuery = updateKeywords.test(message);

  // Extract content type if present
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

/**
 * Detect if query is asking for personal information
 */
export function isPersonalInformationQuery(message: string): boolean {
  const personalQuestions =
    /\b(where do you work|what do you do|who are you|about you|your work|your job|your company|social media|are you on|contact|email|your background|your experience|day---break|tell me about yourself)\b/i;
  return personalQuestions.test(message);
}

/**
 * Optimize search query for specific content types
 */
export function optimizeSearchQuery(message: string, contentType?: string): string {
  if (contentType) {
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
  return message;
}

/**
 * Filter and prioritize matches by content type (path)
 */
export function filterByContentType(matches: RAGContext[], contentType?: string): RAGContext[] {
  if (!contentType || !matches.length) {
    return matches;
  }

  console.log(`[RAG_SERVICE] Filtering for content type: ${contentType}`);

  const exactMatches: RAGContext[] = [];
  const otherMatches: RAGContext[] = [];

  for (const match of matches) {
    const matchPath = match.path;

    if (matchPath === contentType) {
      // Give exact matches a massive score boost
      match.score = (match.score || 0) + 10000000;
      exactMatches.push(match);
      console.log(`[RAG_SERVICE] ✅ Found exact match: ${match.title || match.slug}`);
    } else {
      otherMatches.push(match);
    }
  }

  return exactMatches.length > 0 ? [...exactMatches, ...otherMatches] : matches;
}

/**
 * Sort matches with recency bias
 */
export function sortWithRecencyBias(matches: RAGContext[], isRecencyQuery: boolean): RAGContext[] {
  return matches.sort((a, b) => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const getCreatedDate = (match: RAGContext): number => {
      if (match.created) {
        const date = new Date(match.created).getTime();
        if (!isNaN(date)) return date;
      }
      if (match.published) {
        const date = new Date(match.published).getTime();
        if (!isNaN(date)) return date;
      }
      return new Date("1970-01-01").getTime();
    };

    const dateA = getCreatedDate(a);
    const dateB = getCreatedDate(b);

    // For explicit recency queries, sort purely by date
    if (isRecencyQuery) {
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      return (b.score || 0) - (a.score || 0);
    }

    // For other queries, apply recency boost
    const ageInDaysA = (now - dateA) / dayMs;
    const ageInDaysB = (now - dateB) / dayMs;

    const getRecencyBoost = (ageInDays: number): number => {
      if (ageInDays < 1) return 2000000;
      if (ageInDays < 3) return 1500000;
      if (ageInDays < 7) return 1000000;
      if (ageInDays < 14) return 750000;
      if (ageInDays < 30) return 500000;
      if (ageInDays < 60) return 300000;
      if (ageInDays < 90) return 200000;
      if (ageInDays < 180) return 100000;
      if (ageInDays < 365) return 50000;
      return 0;
    };

    const finalScoreA = (a.score || 0) + getRecencyBoost(ageInDaysA);
    const finalScoreB = (b.score || 0) + getRecencyBoost(ageInDaysB);

    // If scores are close, prioritize recency
    if (Math.abs(finalScoreA - finalScoreB) < 10000) {
      return dateB - dateA;
    }

    return finalScoreB - finalScoreA;
  });
}

/**
 * Process raw Pinata matches into structured context
 */
export function processMatches(rawMatches: any[]): RAGContext[] {
  return rawMatches
    .map((match) => {
      let text = "";
      let jsonData: any = {};

      const data = match.file;

      if (data) {
        if (typeof data === "object" && data !== null && !Array.isArray(data)) {
          jsonData = data;
          text = `${jsonData.title || ""} - ${jsonData.excerpt || ""}`.trim();
          if (text.startsWith(" - ")) {
            text = text.substring(3);
          }
        } else {
          const dataString = typeof data === "string" ? data : String(data);
          try {
            jsonData = JSON.parse(dataString);
            text = `${jsonData.title || ""} - ${jsonData.excerpt || ""}`.trim();
            if (text.startsWith(" - ")) {
              text = text.substring(3);
            }
          } catch (e) {
            text = dataString;
            // For old text format, use as-is (frontmatter parsing would require async)
            // This is handled in the original rag-chat.json.ts if needed
          }
        }
      }

      return {
        ...match,
        text,
        title: jsonData.title || match.keyvalues?.name,
        slug: jsonData.slug || match.keyvalues?.slug,
        path: jsonData.path || match.keyvalues?.path,
        permalink:
          jsonData.permalink ||
          match.keyvalues?.permalink ||
          (jsonData.path && jsonData.slug ? `/${jsonData.path}/${jsonData.slug}` : undefined),
        published: jsonData.published || match.keyvalues?.published,
        updated: jsonData.updated || match.keyvalues?.updated,
        created: match.keyvalues?.created || jsonData.created || match.keyvalues?.published || jsonData.published,
      };
    })
    .filter((match) => match.text);
}

/**
 * Main RAG query function
 */
export async function queryRAG(query: RAGQuery): Promise<RAGResult> {
  const { message, contentType, useRecencyContext = false, maxResults = 3 } = query;

  // Analyze query for recency and content type
  const recencyInfo = analyzeRecencyQuery(message);
  const isPersonalQuery = isPersonalInformationQuery(message);

  // Optimize search query
  const searchQuery = recencyInfo.isRecency ? optimizeSearchQuery(message, recencyInfo.contentType) : message;

  console.log(`[RAG_SERVICE] Original query: "${message}"`);
  console.log(`[RAG_SERVICE] Optimized query: "${searchQuery}"`);
  console.log(`[RAG_SERVICE] Content type: ${contentType || "any"}`);
  console.log(`[RAG_SERVICE] Is recency query: ${recencyInfo.isRecency}`);

  // Query Pinata
  const pinataResult = await queryPinataVectors(
    searchQuery,
    false, // returnFile is handled internally
    contentType || (isPersonalQuery ? "profile" : "content"),
    useRecencyContext || recencyInfo.isRecency
  );

  let matches: RAGContext[] = [];

  if (pinataResult.matches && Array.isArray(pinataResult.matches)) {
    // Process raw matches
    matches = processMatches(pinataResult.matches);

    // Apply content type filtering
    if (recencyInfo.contentType) {
      matches = filterByContentType(matches, recencyInfo.contentType);
    }

    // Sort with recency bias
    matches = sortWithRecencyBias(matches, recencyInfo.isRecency);

    // Limit results
    matches = matches.slice(0, maxResults);
  }

  console.log(`[RAG_SERVICE] Final matches: ${matches.length}`);

  return {
    matches,
    query: searchQuery,
    contentType: contentType || recencyInfo.contentType,
    isRecencyQuery: recencyInfo.isRecency,
  };
}

/**
 * Format RAG context for prompt inclusion
 */
export function formatRAGContext(matches: RAGContext[], isPersonalQuery: boolean = false): string {
  if (matches.length === 0) return "";

  if (isPersonalQuery) {
    // For personal queries, return the raw text content
    return matches.map((match) => match.text).join("\n\n");
  }

  // For content queries, format with metadata
  return matches
    .map((match) => {
      const createdDate = match.created || match.published || "unknown date";
      const isRecent = match.created && new Date(match.created).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recencyMarker = isRecent ? " (recent)" : "";
      return `${match.title || "Post"} (${createdDate}${recencyMarker}): ${match.text}`;
    })
    .join("\n\n");
}

/**
 * Extract content suggestions from matches
 */
export function extractContentSuggestions(matches: RAGContext[], maxSuggestions: number = 3): string {
  if (matches.length === 0) return "";

  const suggestions: string[] = [];
  for (const match of matches) {
    if (match?.title && !suggestions.includes(match.title)) {
      suggestions.push(match.title);
    } else if (match?.slug && !suggestions.includes(match.slug)) {
      suggestions.push(match.slug);
    }
    if (suggestions.length >= maxSuggestions) break;
  }

  return suggestions.length > 0 ? `You might be interested in: ${suggestions.join(", ")}.` : "";
}
