<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { tick } from "svelte";
  import { marked } from "marked";
  import { CONVERSATION_STARTERS } from "../../lib/matthias-bot";

  // Types
  type Role = "user" | "assistant";
  interface Message {
    role: Role;
    content: string;
    timestamp?: number;
    context?: {
      title?: string;
      slug?: string;
      permalink?: string;
      published?: string;
      updated?: string;
      created?: string;
      text?: string;
      score?: number;
      file_id?: string;
      cid?: string;
    }[];
  }
  interface ChatResponse {
    answer: string;
    context: {
      title?: string;
      slug?: string;
      permalink?: string;
      published?: string;
      updated?: string;
      created?: string;
    }[];
  }

  let messages: Message[] = [];
  let input = "";
  let loading = false;
  let showContext: boolean[] = [false];
  let inputRef: HTMLInputElement | null = null;
  let chatEndRef: HTMLDivElement | null = null;

  // Enhanced session management with cleanup
  const SESSION_STORAGE_KEY = "rag-chat-session";
  const MAX_STORED_MESSAGES = 50; // Limit stored messages to prevent bloat
  const SESSION_CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  const MAX_SESSIONS_TO_KEEP = 5; // Keep only recent sessions
  let sessionId = "";
  let cleanupInterval: ReturnType<typeof setInterval> | null = null;

  // Storage cleanup functions
  function cleanupOldSessions() {
    try {
      const allKeys = Object.keys(localStorage);
      const sessionKeys = allKeys.filter((key) => key.startsWith("rag-chat-session"));

      if (sessionKeys.length <= MAX_SESSIONS_TO_KEEP) return;

      // Get session timestamps and sort by age
      const sessions = sessionKeys
        .map((key) => {
          try {
            const data = JSON.parse(localStorage.getItem(key) || "{}");
            return { key, timestamp: data.timestamp || 0 };
          } catch {
            return { key, timestamp: 0 };
          }
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      // Remove oldest sessions
      const sessionsToRemove = sessions.slice(MAX_SESSIONS_TO_KEEP);
      sessionsToRemove.forEach((session) => {
        localStorage.removeItem(session.key);
        console.log(`[CLEANUP] Removed old session: ${session.key}`);
      });

      console.log(`[CLEANUP] Cleaned up ${sessionsToRemove.length} old sessions`);
    } catch (e) {
      console.warn("[CLEANUP] Failed to cleanup old sessions:", e);
    }
  }

  function cleanupCurrentSession() {
    if (messages.length > MAX_STORED_MESSAGES) {
      // Keep only recent messages
      messages = messages.slice(-MAX_STORED_MESSAGES);
      showContext = showContext.slice(-MAX_STORED_MESSAGES);
      saveSession();
      console.log(`[CLEANUP] Trimmed session to ${MAX_STORED_MESSAGES} messages`);
    }
  }

  function checkStorageHealth() {
    try {
      // Check if localStorage is getting full
      const testKey = "storage-test";
      const testData = "x".repeat(1024); // 1KB test
      localStorage.setItem(testKey, testData);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn("[STORAGE] Storage may be full, cleaning up...");
      cleanupOldSessions();
      return false;
    }
  }

  // Generate or load session ID
  function initializeSession() {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored);
        sessionId = session.id;
        messages = (session.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp || Date.now(),
        }));
        showContext = new Array(messages.length).fill(false);
        console.log(`[SESSION] Loaded session ${sessionId} with ${messages.length} messages`);

        // Clean up if needed
        cleanupCurrentSession();
      } catch (e) {
        console.warn("[SESSION] Failed to parse stored session, creating new one");
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }

  function createNewSession() {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    messages = [];
    showContext = [];
    saveSession();
    console.log(`[SESSION] Created new session ${sessionId}`);
  }

  function saveSession() {
    try {
      // Check storage health before saving
      if (!checkStorageHealth()) {
        console.warn("[SESSION] Storage issues detected, skipping save");
        return;
      }

      const session = {
        id: sessionId,
        messages: messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp || Date.now(),
        })),
        timestamp: Date.now(),
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      console.log(`[SESSION] Saved session ${sessionId} with ${messages.length} messages`);
    } catch (e) {
      console.warn("[SESSION] Failed to save session:", e);
      // Try cleanup and retry once
      cleanupOldSessions();
      try {
        const session = {
          id: sessionId,
          messages: messages.slice(-20), // Keep only last 20 messages as fallback
          timestamp: Date.now(),
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        console.log("[SESSION] Saved session with reduced message count after cleanup");
      } catch (e2) {
        console.error("[SESSION] Failed to save session even after cleanup:", e2);
      }
    }
  }

  // Clear session function for user control
  function clearSession() {
    messages = [];
    showContext = [];
    createNewSession();
    console.log("[SESSION] Session cleared by user");
  }

  // Use the centralized conversation starters
  const prompts = CONVERSATION_STARTERS;

  async function sendMessage(messageOverride?: string) {
    const trimmed = (messageOverride !== undefined ? messageOverride : input).trim();
    if (!trimmed || loading) return;

    // Add user message with timestamp
    const userMessage: Message = {
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    messages = [...messages, userMessage];
    input = "";
    loading = true;
    showContext = [...showContext, false];

    // Scroll to show the user message immediately
    await tick();
    scrollToBottom();

    // Retry logic for cold starts
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[FRONTEND] Attempt ${attempt}/${maxRetries} - Sending request:`, {
          message: trimmed,
          sessionId: sessionId,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased timeout for better responses

        const res = await fetch("/api/rag-chat.json", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            sessionId: sessionId,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log(`[FRONTEND] Attempt ${attempt} - Fetch completed, response object:`, res);
        console.log("[FRONTEND] Response status:", res.status, res.statusText);

        if (!res.ok) {
          console.error("[FRONTEND] API request failed with status:", res.status);
          const responseText = await res.text();
          console.error("[FRONTEND] Error response body:", responseText);

          let err: any = {};
          try {
            err = JSON.parse(responseText);
          } catch (parseError) {
            console.error("[FRONTEND] Failed to parse error response as JSON:", parseError);
            err = { error: `Server error (${res.status}): ${responseText}` };
          }

          // For any error, add an assistant message explaining the issue
          const errorMessage: Message = {
            role: "assistant",
            content: err.error || `Sorry, I encountered an error (${res.status}). Please try again.`,
            context: [],
            timestamp: Date.now(),
          };
          messages = [...messages, errorMessage];
          showContext = [...showContext, false];
          saveSession();
          return;
        }

        const responseText = await res.text();
        console.log("[FRONTEND] Raw response text:", responseText);

        let data: ChatResponse;
        try {
          data = JSON.parse(responseText);
          console.log("[FRONTEND] Parsed response:", data);
          console.log("[FRONTEND] Context received:", data.context);
          console.log("[FRONTEND] Context length:", data.context?.length || 0);
        } catch (parseError) {
          console.error("[FRONTEND] Failed to parse response as JSON:", parseError);
          console.error("[FRONTEND] Response text was:", responseText);
          throw new Error(`Invalid JSON response: ${parseError}`);
        }

        // Add assistant response with timestamp
        const assistantMessage: Message = {
          role: "assistant",
          content: data.answer,
          context: data.context,
          timestamp: Date.now(),
        };
        messages = [...messages, assistantMessage];
        showContext = [...showContext, false];

        // Save session after successful exchange
        saveSession();

        // Clean up if needed
        cleanupCurrentSession();

        // Success! Reset loading state and scroll
        loading = false;
        await tick();
        scrollToBottom();
        inputRef?.focus();
        return;
      } catch (e) {
        console.error(`[FRONTEND] Attempt ${attempt} failed:`, e);
        lastError = e instanceof Error ? e : new Error(String(e));

        // If this is the last attempt, don't retry
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[FRONTEND] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // If we get here, all retries failed
    console.error("[FRONTEND] All retry attempts failed, last error:", lastError);
    const errorMessage = lastError?.message || "Unknown error";
    const failureMessage: Message = {
      role: "assistant",
      content: `Sorry, I'm having trouble connecting right now. Error: ${errorMessage}. Please try again in a moment.`,
      context: [],
      timestamp: Date.now(),
    };
    messages = [...messages, failureMessage];
    showContext = [...showContext, false];
    saveSession();

    // Always reset loading state and scroll
    loading = false;
    await tick();
    scrollToBottom();
    inputRef?.focus();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function toggleContext(idx: number) {
    console.log(`[FRONTEND] Toggling context for message ${idx}`);
    console.log(`[FRONTEND] Message context:`, messages[idx]?.context);
    showContext = showContext.map((v, i) => (i === idx ? !v : v));
    // Scroll to bottom after context toggle to ensure visibility
    await tick();
    scrollToBottom();
  }

  function handlePromptClick(prompt: string) {
    input = prompt;
    sendMessage(prompt);
  }

  onMount(async () => {
    // Initialize session and load any existing messages
    initializeSession();

    // Set up periodic cleanup
    cleanupInterval = setInterval(() => {
      cleanupOldSessions();
      cleanupCurrentSession();
    }, SESSION_CLEANUP_INTERVAL);

    // Focus input on mount
    if (inputRef) inputRef.focus();

    // Scroll to bottom if there are existing messages
    if (messages.length > 0) {
      await tick();
      scrollToBottom();
    }
  });

  onDestroy(() => {
    // Clean up interval
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }
  });

  // Scroll to bottom when messages change
  $: if (messages.length > 0) {
    tick().then(() => scrollToBottom());
  }

  // Scroll to bottom when loading state changes (to show/hide loading indicator)
  $: if (loading) {
    // Small delay to ensure loading indicator is rendered, use immediate scroll
    scrollToBottom();
  }

  // Configure marked for safe rendering
  marked.setOptions({
    breaks: true, // Convert line breaks to <br>
    gfm: true, // GitHub Flavored Markdown
  });

  // Safe markdown parser using marked
  function parseMarkdown(text: string): string {
    if (!text) return "";

    try {
      // Use marked to parse markdown
      const html = marked.parse(text, { async: false }) as string;

      // Basic XSS prevention - remove script tags and dangerous attributes
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .replace(/javascript:/gi, "");
    } catch (error) {
      console.error("Markdown parsing error:", error);
      // Fallback to escaped text if parsing fails
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }

  // Format timestamp for display
  function formatTimestamp(timestamp?: number): string {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }

  // Format context dates (handles string dates from content)
  function formatContextDate(dateStr?: string): string {
    if (!dateStr) return "";

    try {
      // Handle different date formats from content
      let date: Date;

      if (dateStr === "true" || dateStr === "false") {
        return ""; // Skip boolean values
      }

      // Handle "YYYY-MM-DD HH:MM" format
      if (dateStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
        date = new Date(dateStr);
      }
      // Handle "YYYY-MM-DD" format
      else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dateStr);
      }
      // Handle timestamp format
      else if (/^\d+$/.test(dateStr)) {
        date = new Date(parseInt(dateStr));
      }
      // Try parsing as-is
      else {
        date = new Date(dateStr);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "";
      }

      return date.toLocaleDateString();
    } catch (error) {
      console.warn("Error formatting context date:", dateStr, error);
      return "";
    }
  }

  // Filter context to only show sources that are likely referenced in the response
  function filterRelevantContext(content: string, context: any[]): any[] {
    if (!context || context.length === 0) return [];

    const contentLower = content.toLowerCase();

    return context.filter((ctx) => {
      // Check if the title, slug, or key terms from the content are mentioned
      const title = (ctx.title || "").toLowerCase();
      const slug = (ctx.slug || "").toLowerCase();

      // If title or slug is mentioned in the response, include it
      if (title && contentLower.includes(title)) return true;
      if (slug && contentLower.includes(slug)) return true;

      // Check for specific content type mentions
      if (title.includes("recipe") && contentLower.includes("recipe")) return true;
      if (title.includes("spice") && contentLower.includes("spice")) return true;
      if (title.includes("halal") && contentLower.includes("halal")) return true;

      // For very short responses, be more lenient
      if (content.length < 200 && context.length <= 2) return true;

      return false;
    });
  }

  function scrollToBottom() {
    if (chatEndRef) {
      requestAnimationFrame(() => {
        if (chatEndRef) {
          chatEndRef.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }
      });
    }
  }
</script>

<div class="chat-container" aria-label="RAG Chat Interface">
  <!-- Chat header with session controls -->
  <div class="chat-header">
    <div class="session-info">
      <span class="session-id">Session: {sessionId.split("_")[1]}</span>
      <span class="message-count">{messages.length} messages</span>
    </div>
    <button class="clear-session-btn" on:click={clearSession} title="Clear conversation"> Clear Chat </button>
  </div>

  <!-- Messages area - independent positioning -->
  <div class="chat-messages" role="log" aria-live="polite">
    {#each messages as msg, i}
      <div class="message {msg.role}">
        <div class="message-header">
          <span class="role-indicator">{msg.role === "user" ? "You" : "Matthias"}</span>
          {#if msg.timestamp}
            <span class="timestamp">{formatTimestamp(msg.timestamp)}</span>
          {/if}
        </div>
        <div class="bubble">
          {#if msg.role === "assistant"}
            <span class="content">{@html parseMarkdown(msg.content)}</span>
          {:else}
            <span class="content">{msg.content}</span>
          {/if}
        </div>
        {#if msg.role === "assistant" && msg.context && msg.context.length > 0}
          {@const filteredContext = filterRelevantContext(msg.content, msg.context)}
          {#if filteredContext.length > 0}
            <div class="context-section">
              <button
                class="context-toggle"
                aria-expanded={showContext[i]}
                aria-controls={`context-${i}`}
                on:click={() => toggleContext(i)}
              >
                {showContext[i] ? "Hide sources" : `Sources (${filteredContext.length})`}
              </button>
              {#if showContext[i]}
                <div class="context-list" id={`context-${i}`}>
                  {#each filteredContext as ctx}
                    <div class="context-item">
                      {#if ctx.permalink}
                        <a href={ctx.permalink} target="_blank" rel="noopener noreferrer" class="context-link">
                          {ctx.title || ctx.slug || ctx.permalink}
                        </a>
                      {:else}
                        <span class="context-title">{ctx.title || ctx.slug || "Untitled"}</span>
                      {/if}
                      {#if ctx.published || ctx.created}
                        <span class="context-date">{formatContextDate(ctx.created || ctx.published)}</span>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        {/if}
      </div>
    {/each}
    {#if loading}
      <div class="message assistant">
        <div class="message-header">
          <span class="role-indicator">Matthias</span>
          <span class="timestamp">typing...</span>
        </div>
        <div class="bubble">
          <span class="loader"></span>
        </div>
      </div>
    {/if}
    <div tabindex="-1" aria-hidden="true" bind:this={chatEndRef}></div>
  </div>
</div>

<!-- Chat input - independent positioning -->
<div class="chat-input-container">
  <form class="input-row" on:submit|preventDefault={() => sendMessage()} autocomplete="off">
    <label for="chat-input" class="sr-only">Type your message</label>
    <input
      id="chat-input"
      class="chat-input"
      type="text"
      bind:value={input}
      bind:this={inputRef}
      placeholder="Ask me anything..."
      on:keydown={handleKeydown}
      aria-label="Type your message"
      autocomplete="off"
      required
      disabled={loading}
      maxlength={500}
    />
    <button class="send-btn" type="submit" disabled={loading || !input.trim()} aria-label="Send">
      {loading ? "..." : "Send"}
    </button>
  </form>

  <div class="suggested-prompts-container">
    <div class="suggested-prompts">
      {#each prompts as prompt}
        <button type="button" class="prompt-btn" on:click={() => handlePromptClick(prompt)}>{prompt}</button>
      {/each}
    </div>
  </div>
</div>

<style>
  .chat-container {
    max-width: 600px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem;
    position: relative;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.5rem;
    border-bottom: 1px solid var(--grey-light);
  }

  .session-info {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: var(--grey-dark);
  }

  .session-id {
    font-family: monospace;
  }

  .clear-session-btn {
    background: var(--grey-light);
    color: var(--grey-dark);
    border: none;
    border-radius: 0.5rem;
    padding: 0.25rem 0.75rem;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .clear-session-btn:hover {
    background: var(--grey);
    color: var(--white);
  }

  .chat-messages {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0 0.5rem 2rem 0.5rem;
    margin-bottom: 8rem; /* Space for fixed input */
  }

  .message:last-child {
    margin-bottom: 1rem;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
    font-size: 0.85rem;
  }

  .role-indicator {
    font-weight: 600;
    color: var(--color);
  }

  .message.user .role-indicator {
    color: var(--blue);
  }

  .message.assistant .role-indicator {
    color: var(--gold-darker);
  }

  .timestamp {
    color: var(--grey-dark);
    font-size: 0.8rem;
  }

  .bubble {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    border-left: 2px solid var(--gold);
    border-radius: 0.25rem;
    padding: 0 1rem;
    font-size: 1rem;
    word-break: break-word;
    background: transparent;
    color: var(--color);
    box-shadow: none;
    border-top: none;
    border-bottom: none;
    border-right: none;
  }

  .message.user .bubble {
    border-left: 4px solid var(--blue);
    font-weight: 500;
  }

  .message.assistant .bubble {
    border-left: 4px solid var(--gold);
    font-weight: 400;
  }

  .context-section {
    border-top: 1px solid var(--grey-light);
  }

  .context-toggle {
    background: none;
    border: none;
    color: var(--grey-dark);
    cursor: pointer;
    font-size: 0.85rem;
    text-decoration: none;
    padding: 0;
    transition: color 0.2s;
    font-weight: 500;
  }

  .context-toggle:hover {
    color: var(--color);
  }

  .context-list {
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .context-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .context-link {
    color: var(--link-color-light);
    text-decoration: none;
    font-weight: 500;
  }

  .context-link:hover {
    color: var(--link-hover-color-light);
    text-decoration: underline;
  }

  .context-title {
    color: var(--color);
    font-weight: 500;
  }

  .context-date {
    color: var(--grey-dark);
    font-size: 0.8rem;
    font-weight: 400;
  }

  .context-date::before {
    content: "•";
    margin-right: 0.25rem;
  }

  /* Chat input - positioned independently */
  .chat-input-container {
    max-width: 600px;
    width: 100%;
    margin: 0 auto;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--background);
    border-top: 1px solid var(--grey-light);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    z-index: 100;
    /* Center the content with max-width like other elements */
    align-items: center;
  }

  .input-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    width: 100%;
    max-width: 600px;
  }

  .suggested-prompts-container {
    width: 100%;
    max-width: 600px;
  }

  .chat-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: var(--border);
    font-size: 1rem;
    outline: none;
    background: var(--background);
    color: var(--color);
    transition: border 0.2s;
  }

  .chat-input:focus {
    border: 1.5px solid var(--gold);
    box-shadow: 0 0 0 2px var(--focus-outline);
  }

  .send-btn {
    background: var(--blue);
    color: var(--white);
    border: none;
    border-radius: 0.75rem;
    padding: 0.75rem 1.25rem;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
    font-weight: 500;
  }

  .send-btn:disabled {
    background: var(--blue-lighter);
    color: var(--grey);
    cursor: not-allowed;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  .suggested-prompts {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    flex-wrap: wrap;
    vertical-align: middle;
    font-size: var(--fs-xs);
    color: var(--grey-dark);
  }

  .prompt-btn {
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--color);
    transition: background 0.2s;
    padding: 0 0.25rem;
    border: none;
    border-radius: 0;
    background: light-dark(var(--grey-light), var(--grey-dark));
    color: light-dark(var(--grey-dark), var(--grey-light));
    cursor: pointer;
  }

  .prompt-btn:hover {
    background: #e0e0e0;
    color: var(--black);
  }

  @media (max-width: 600px) {
    .chat-container {
      padding: 0.5rem;
    }

    .chat-messages {
      padding: 0 0.25rem 2rem 0.25rem;
    }

    .bubble {
      font-size: 0.97rem;
      padding: 0 0.8rem;
    }

    .chat-input {
      font-size: 0.97rem;
      padding: 0.6rem 0.8rem;
    }
  }

  /* Loading indicator */
  .loader {
    width: 2px;
    height: 2px;
    display: inline-block;
    margin: 8px 0;
    position: relative;
    border-radius: 2px;
    color: var(--color);
    background: currentColor;
    box-sizing: border-box;
    animation: animloader 0.6s 0.6s linear infinite alternate;
  }

  .loader::after,
  .loader::before {
    content: "";
    box-sizing: border-box;
    width: 2px;
    height: 2px;
    border-radius: 2px;
    background: currentColor;
    position: absolute;
    left: 0;
    top: 4px;
    animation: animloader 0.6s 0.8s linear infinite alternate;
  }

  .loader::after {
    top: -4px;
    animation-delay: 0s;
  }

  @keyframes animloader {
    0% {
      width: 2px;
    }
    100% {
      width: 24px;
    }
  }

  .content {
    word-break: break-word;
  }

  /* Markdown content styling */
  .content :global(strong) {
    font-weight: 600;
    color: var(--gold-darker);
  }

  .content :global(em) {
    font-style: italic;
  }

  .content :global(code) {
    font-family: monospace;
    background: light-dark(var(--grey-light), var(--grey-dark));
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.9em;
  }

  .content :global(h1),
  .content :global(h2),
  .content :global(h3) {
    font-weight: 600;
    margin: 0.5rem 0 0.25rem 0;
    line-height: 1.3;
  }

  .content :global(h1) {
    font-size: 1.2em;
  }

  .content :global(h2) {
    font-size: 1.1em;
  }

  .content :global(h3) {
    font-size: 1.05em;
  }

  .content :global(ul),
  .content :global(ol) {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  .content :global(li) {
    margin: 0.25rem 0;
  }

  .content :global(p) {
    margin: 0.5rem 0;
  }

  .content :global(p:first-child) {
    margin-top: 0;
  }

  .content :global(p:last-child) {
    margin-bottom: 0;
  }
</style>
