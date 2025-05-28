import { createHash } from "crypto";
import path from "path";

// ---- Types ----
export interface RAGChunk {
  text: string;
  tokens: string[];
  metadata: {
    slug: string;
    title: string;
    collection: string;
    [key: string]: unknown;
  };
}

// Core RAG functionality for content processing
export interface ContentMatch {
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

// Query analysis for better search targeting
export interface QueryAnalysis {
  isPersonalQuery: boolean;
  isRecencyQuery: boolean;
  contentType?: string;
  searchTerms: string[];
}

// Analyze user query to determine search strategy
export function analyzeUserQuery(message: string): QueryAnalysis {
  const personalPatterns =
    /\b(where do you work|what do you do|who are you|about you|your work|your job|your company|social media|are you on|contact|email|your background|your experience|day---break|tell me about yourself)\b/i;
  const isPersonalQuery = personalPatterns.test(message);

  const recencyPatterns = /\b(latest|recent|newest|last|new|current|updated)\b/i;
  const isRecencyQuery = recencyPatterns.test(message);

  // Determine content type for better search
  let contentType: string | undefined;
  if (isPersonalQuery) {
    contentType = "profile";
  } else if (/\b(recipe|recipes|cooking|food|meal|cook|bake)\b/i.test(message)) {
    contentType = "recipes";
  } else if (/\b(project|projects|work|build|building|development|coding)\b/i.test(message)) {
    contentType = "projects";
  } else if (/\b(photo|photos|photography|image|images|camera|cameras|gear)\b/i.test(message)) {
    contentType = "photography";
  } else if (/\b(post|posts|article|articles|blog|writing|write|wrote)\b/i.test(message)) {
    contentType = "posts";
  }

  // Extract search terms
  const searchTerms = extractSearchTerms(message, contentType);

  return { isPersonalQuery, isRecencyQuery, contentType, searchTerms };
}

// Extract meaningful search terms from user message
function extractSearchTerms(message: string, contentType?: string): string[] {
  // Content-specific search optimization
  const contentSearchTerms: Record<string, string[]> = {
    profile: ["Matthias", "Jordan", "profile", "personal", "information", "background"],
    recipes: ["recipe", "cooking", "food", "ingredient", "meal", "cook", "bake", "kitchen"],
    projects: ["project", "development", "coding", "build", "programming", "software", "web", "app"],
    photography: ["photography", "photo", "camera", "image", "picture", "gear", "equipment"],
    posts: ["blog", "post", "article", "writing", "content", "thoughts", "opinion"],
  };

  if (contentType && contentSearchTerms[contentType]) {
    return contentSearchTerms[contentType];
  }

  // Extract meaningful terms from the message
  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));

  return words.slice(0, 10); // Limit to top 10 terms
}

// Process and format RAG context for prompts
export function formatRAGContext(matches: ContentMatch[], isPersonalQuery: boolean = false): string {
  if (matches.length === 0) return "";

  return matches
    .map((match) => {
      const date = match.created || match.published || "unknown date";
      const title = match.title || "Content";
      return `${title} (${date}): ${match.text}`;
    })
    .join("\n\n");
}

// Generate content suggestions from matches
export function extractContentSuggestions(matches: ContentMatch[]): string[] {
  const suggestions: string[] = [];

  for (const match of matches) {
    if (match.title && !suggestions.includes(match.title)) {
      suggestions.push(match.title);
    } else if (match.slug && !suggestions.includes(match.slug)) {
      suggestions.push(match.slug);
    }

    if (suggestions.length >= 3) break;
  }

  return suggestions;
}

// ---- STOPWORDS ----
export const STOPWORDS = new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "against",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "aren't",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can't",
  "cannot",
  "could",
  "couldn't",
  "did",
  "didn't",
  "do",
  "does",
  "doesn't",
  "doing",
  "don't",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "hadn't",
  "has",
  "hasn't",
  "have",
  "haven't",
  "having",
  "he",
  "he'd",
  "he'll",
  "he's",
  "her",
  "here",
  "here's",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "how's",
  "i",
  "i'd",
  "i'll",
  "i'm",
  "i've",
  "if",
  "in",
  "into",
  "is",
  "isn't",
  "it",
  "it's",
  "its",
  "itself",
  "let's",
  "me",
  "more",
  "most",
  "mustn't",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "ought",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "shan't",
  "she",
  "she'd",
  "she'll",
  "she's",
  "should",
  "shouldn't",
  "so",
  "some",
  "such",
  "than",
  "that",
  "that's",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "there's",
  "these",
  "they",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "wasn't",
  "we",
  "we'd",
  "we'll",
  "we're",
  "we've",
  "were",
  "weren't",
  "what",
  "what's",
  "when",
  "when's",
  "where",
  "where's",
  "which",
  "while",
  "who",
  "who's",
  "whom",
  "why",
  "why's",
  "with",
  "won't",
  "would",
  "wouldn't",
  "you",
  "you'd",
  "you'll",
  "you're",
  "you've",
  "your",
  "yours",
  "yourself",
  "yourselves",
  "—",
  "etc",
]);
