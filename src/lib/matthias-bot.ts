/**
 * Matthias-bot: Core personality and conversation system
 * Single source of truth for all chat prompts and personality
 */

// Core personality and context - consolidated system prompt
export const MATTHIAS_SYSTEM_PROMPT = `You are Matthias Jordan, a photographer turned growth technologist.

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

// Enhanced context about Matthias (fallback when profile isn't available)
export const MATTHIAS_FALLBACK_CONTEXT = `I'm Matthias, a photographer turned growth technologist. I run day---break, a marketing consultancy focused on growth and lifecycle automation. I enjoy photography, cooking, building solar-powered computers, and family time.`;

// Query analysis helpers
export function isPersonalQuery(message: string): boolean {
  const personalPatterns =
    /\b(where do you work|what do you do|who are you|about you|your work|your job|your company|social media|contact|email|day---break|tell me about yourself)\b/i;
  return personalPatterns.test(message);
}

export function isRecencyQuery(message: string): boolean {
  const recencyPatterns = /\b(latest|recent|newest|last|new|current|updated|lately|recently|2024|2025)\b/i;
  return recencyPatterns.test(message);
}

export function isRecipeQuery(message: string): boolean {
  const recipePatterns = /\b(recipe|recipes|cooking|food|dish|meal|ingredient|cook|bake|kitchen|culinary)\b/i;
  return recipePatterns.test(message);
}

export function isArtQuery(message: string): boolean {
  const artPatterns = /\b(art|artwork|photo|photography|image|picture|visual|creative|artist)\b/i;
  return artPatterns.test(message);
}

export function isCodeQuery(message: string): boolean {
  const codePatterns = /\b(code|coding|programming|development|project|github|open.?source|software|tech)\b/i;
  return codePatterns.test(message);
}

// Conversation context building
export function buildConversationContext(
  messages: Array<{ role: string; content: string }>,
  maxMessages: number = 6
): string {
  if (messages.length === 0) return "";

  const recentMessages = messages.slice(-maxMessages);
  return recentMessages.map((msg) => `${msg.role === "user" ? "User" : "Matthias"}: ${msg.content}`).join("\n");
}

// Content chat prompt generation
export function generateContentChatPrompt(
  message: string,
  content: {
    title: string;
    slug: string;
    path: string;
    body: string;
    tags: string[];
    created: string;
    updated: string;
  },
  conversationHistory?: string
): string {
  const CONTENT_SYSTEM_PROMPT = `You are continuing a conversation about specific content. Answer questions about the provided content naturally and directly.

## Response Guidelines:
- Answer based on the specific content provided
- Keep responses conversational and concise (2-4 sentences typically)
- Reference relevant parts of the content when helpful`;

  let prompt = CONTENT_SYSTEM_PROMPT;

  if (conversationHistory) {
    prompt += `\n\n## Recent Conversation:\n${conversationHistory}`;
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

  return prompt;
}

// General chat prompt generation
export function generateGeneralChatPrompt(
  message: string,
  conversationHistory?: string,
  contextMatches?: Array<{
    title?: string;
    text: string;
    created?: string;
    published?: string;
  }>
): string {
  let prompt = MATTHIAS_SYSTEM_PROMPT;

  if (conversationHistory) {
    prompt += `\n\n## Recent Conversation:\n${conversationHistory}`;
  }

  if (contextMatches && contextMatches.length > 0) {
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

  return prompt;
}

/**
 * Validation responses with Matthias personality
 */
export const VALIDATION_RESPONSES = {
  inappropriate: ["(¬_¬)", "( ꒪Д꒪)", "(ಠ_ಠ)"],
  tooLong: "Please keep your questions concise. What would you like to know about me?",
  offTopic:
    "I'm here to help with questions about my work and projects. Try asking about photography, tech projects, recipes, or my professional background.",
};

/**
 * Get a random validation response
 */
export function getValidationResponse(type: keyof typeof VALIDATION_RESPONSES): string {
  const responses = VALIDATION_RESPONSES[type];
  if (Array.isArray(responses)) {
    return responses[Math.floor(Math.random() * responses.length)];
  }
  return responses;
}

/**
 * Suggested conversation starters
 */
export const CONVERSATION_STARTERS = [
  "What have you been working on lately?",
  "What's your latest recipe?",
  "What's day---break all about?",
];
