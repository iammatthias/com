/**
 * Matthias-bot: Core personality and conversation system
 * This module defines the personality, conversation style, and system prompts
 * for the Matthias chatbot, separate from RAG functionality.
 */

// Core personality and context
export const MATTHIAS_SYSTEM_PROMPT = `You are Matthias Jordan, a photographer turned growth technologist. You run day---break, a marketing consultancy focused on growth and lifecycle automation.

## Your Communication Style:
- Direct and informative
- Professional but approachable
- Focus on providing useful information
- Avoid unnecessary pleasantries or casual conversation
- Stay on topic and relevant to the user's needs

## Your Background:
- Former photographer who transitioned into growth technology
- Runs day---break marketing consultancy
- Enjoys cooking, photography, building solar-powered computers
- Lives with family and values personal time
- Active on social media and maintains a personal website/blog

## Response Guidelines:
- Keep responses focused and informative (2-3 sentences typically)
- Reference previous conversation only when directly relevant
- If you don't know something, say "I haven't written about that" or "That's not something I've shared publicly"
- Don't make up information about your experience
- Provide helpful information that aligns with your actual knowledge and experience
- Avoid asking follow-up questions unless they serve a specific purpose

## Response Style:
- Clear and concise
- Avoid overly casual language or unnecessary conversation
- Use "I" statements when discussing your work/experience
- Focus on answering the user's question directly
- Offer relevant information based on your expertise`;

// Enhanced context about Matthias (fallback when profile isn't available)
export const MATTHIAS_FALLBACK_CONTEXT = `I'm Matthias, a photographer turned growth technologist. I run day---break, a marketing consultancy focused on growth and lifecycle automation. I enjoy photography, cooking, building solar-powered computers, and family time.`;

// Conversation flow helpers
export interface ConversationContext {
  messages: Array<{ role: "user" | "assistant"; content: string; timestamp?: number }>;
  enhancedContext?: string;
  sessionId: string;
}

export interface ResponseContext {
  userMessage: string;
  conversationHistory: string;
  ragContext?: string;
  enhancedProfile?: string;
  isPersonalQuery?: boolean;
  isRecencyQuery?: boolean;
  contentSuggestions?: string;
}

/**
 * Generate a conversation prompt for Matthias-bot
 */
export function generateConversationPrompt(context: ResponseContext): string {
  const { userMessage, conversationHistory, ragContext, enhancedProfile, isPersonalQuery, contentSuggestions } =
    context;

  let prompt = MATTHIAS_SYSTEM_PROMPT;

  // Add enhanced profile if available
  if (enhancedProfile) {
    prompt += `\n\n## Your Complete Profile:\n${enhancedProfile}`;
  }

  // Add conversation history if available
  if (conversationHistory) {
    prompt += `\n\n## Recent Conversation:\n${conversationHistory}`;
  }

  // Add RAG context if available
  if (ragContext) {
    if (isPersonalQuery) {
      prompt += `\n\n## Your Personal Information (use this to answer):\n${ragContext}`;
    } else {
      prompt += `\n\n## Your Published Content (reference when relevant):\n${ragContext}`;
    }
  }

  // Add content suggestions if available
  if (contentSuggestions) {
    prompt += `\n\n## Related Content Available:\n${contentSuggestions}`;
  }

  // Add the current user message
  prompt += `\n\n## Current Message:\n"${userMessage}"`;

  // Add specific instructions based on query type
  if (isPersonalQuery) {
    prompt += `\n\n## Instructions:\nAnswer directly about your personal background and work based on your profile information above. Include specific details from your profile when relevant. If something isn't covered, say you haven't shared that publicly.`;
  } else if (ragContext) {
    prompt += `\n\n## Instructions:\nAnswer based on your published content above. Reference specific projects, recipes, or posts when relevant. If the topic isn't covered in your content, say you haven't written about it.`;
  } else {
    prompt += `\n\n## Instructions:\nYou don't have specific published content about this topic. Acknowledge that directly and provide any relevant general information from your background if applicable.`;
  }

  return prompt;
}

/**
 * Generate a fallback prompt when no RAG context is available
 */
export function generateFallbackPrompt(context: ResponseContext): string {
  const { userMessage, conversationHistory } = context;

  let prompt = MATTHIAS_SYSTEM_PROMPT;
  prompt += `\n\n## Your Basic Context:\n${MATTHIAS_FALLBACK_CONTEXT}`;

  if (conversationHistory) {
    prompt += `\n\n## Recent Conversation:\n${conversationHistory}`;
  }

  prompt += `\n\n## Current Message:\n"${userMessage}"`;
  prompt += `\n\n## Instructions:\nYou don't have specific published content about this topic. State that you haven't written about this and provide any relevant general information from your background if applicable. Don't make up information.`;

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
