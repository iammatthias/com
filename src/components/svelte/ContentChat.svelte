<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { tick } from "svelte";
  import { marked } from "marked";

  // Props
  export let entry: any;

  // Types
  type Role = "user" | "assistant";
  interface Message {
    role: Role;
    content: string;
    timestamp?: number;
  }

  interface ChatResponse {
    answer: string;
  }

  let messages: Message[] = [];
  let input = "";
  let loading = false;
  let inputRef: HTMLInputElement | null = null;
  let chatEndRef: HTMLDivElement | null = null;
  let mounted = false;
  let userIsScrolling = false;
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  let messagesContainer: HTMLDivElement | null = null;

  // Session management
  const SESSION_STORAGE_KEY = `content-chat-${entry.data.slug}`;
  let sessionId = "";

  // Content-aware conversation starters
  const getContentPrompts = () => {
    const prompts = ["Summarize this"];

    if (entry.data.path === "recipes") {
      prompts.push("What ingredients do I need?", "How long does this take?", "Any substitutions?");
    } else if (entry.data.path === "posts") {
      prompts.push("What's the main point?", "Key takeaways?", "Related topics?");
    } else if (entry.data.path === "art") {
      prompts.push("What's the story behind this?", "Technical details?", "Inspiration?");
    } else {
      prompts.push("Explain the key concepts", "What should I know?", "Main highlights?");
    }

    return prompts;
  };

  const prompts = getContentPrompts();

  // Initialize session
  function initializeSession() {
    sessionId = `content_${entry.data.slug}_${Date.now()}`;

    // Try to load existing session for this content
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored);
        messages = session.messages || [];
        console.log(`[CONTENT_CHAT] Loaded session for ${entry.data.slug} with ${messages.length} messages`);
      } catch (e) {
        console.warn("[CONTENT_CHAT] Failed to parse stored session, creating new one");
        messages = [];
      }
    }
  }

  function saveSession() {
    try {
      const session = {
        slug: entry.data.slug,
        messages: messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp || Date.now(),
        })),
        timestamp: Date.now(),
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn("[CONTENT_CHAT] Failed to save session:", e);
    }
  }

  function clearSession() {
    messages = [];
    localStorage.removeItem(SESSION_STORAGE_KEY);
    console.log("[CONTENT_CHAT] Session cleared");
  }

  async function sendMessage(messageOverride?: string) {
    const trimmed = (messageOverride !== undefined ? messageOverride : input).trim();
    if (!trimmed || loading) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    messages = [...messages, userMessage];
    input = "";
    loading = true;

    await tick();
    smartScroll();

    try {
      const res = await fetch("/api/content-chat.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          content: {
            title: entry.data.title,
            slug: entry.data.slug,
            path: entry.data.path,
            body: entry.body,
            tags: entry.data.tags,
            created: entry.data.created,
            updated: entry.data.updated,
          },
          sessionId: sessionId,
        }),
      });

      if (!res.ok) {
        throw new Error(`API request failed: ${res.status}`);
      }

      const data: ChatResponse = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
        timestamp: Date.now(),
      };
      messages = [...messages, assistantMessage];
      saveSession();
    } catch (e) {
      console.error("[CONTENT_CHAT] Error:", e);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I'm having trouble right now. Please try again.",
        timestamp: Date.now(),
      };
      messages = [...messages, errorMessage];
    }

    loading = false;
    await tick();
    smartScroll();
    inputRef?.focus();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handlePromptClick(prompt: string) {
    input = prompt;
    sendMessage(prompt);
  }

  function scrollToBottom() {
    if (chatEndRef && !userIsScrolling) {
      chatEndRef.scrollIntoView({
        behavior: "auto",
        block: "end",
        inline: "nearest",
      });
    }
  }

  function handleScroll() {
    userIsScrolling = true;
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(() => {
      userIsScrolling = false;
    }, 1000);
  }

  function isNearBottom(): boolean {
    if (!messagesContainer) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
    return scrollHeight - scrollTop - clientHeight < 100;
  }

  function smartScroll() {
    if (!userIsScrolling && isNearBottom()) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }

  // Configure marked for safe rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  function parseMarkdown(text: string): string {
    if (!text) return "";
    try {
      const html = marked.parse(text, { async: false }) as string;
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+="[^"]*"/gi, "")
        .replace(/javascript:/gi, "");
    } catch (error) {
      console.error("Markdown parsing error:", error);
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  }

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

  onMount(() => {
    initializeSession();
    mounted = true;
    if (inputRef) inputRef.focus();

    // Set up scroll event listener
    if (messagesContainer) {
      messagesContainer.addEventListener("scroll", handleScroll);
    }
  });

  onDestroy(() => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    if (messagesContainer) {
      messagesContainer.removeEventListener("scroll", handleScroll);
    }
  });

  // Scroll when messages change
  $: if (messages.length > 0) {
    tick().then(() => smartScroll());
  }

  // Scroll when loading state changes (but only if user isn't scrolling)
  $: if (loading && !userIsScrolling) {
    smartScroll();
  }
</script>

<div class="chat-container" aria-label="Content Chat Interface">
  <!-- Chat header -->
  <div class="chat-header">
    <div class="session-info">
      <span class="content-title">Ask about this {entry.data.path.slice(0, -1)}</span>
    </div>
    {#if messages.length > 0}
      <button class="clear-session-btn" on:click={clearSession} title="Clear conversation">Clear Chat</button>
    {/if}
  </div>

  <!-- Messages area -->
  <div class="chat-messages" role="log" aria-live="polite" bind:this={messagesContainer}>
    {#if messages.length === 0}
      <div class="welcome-message">
        <p>Ask me anything about "<strong>{entry.data.title}</strong>"</p>
      </div>
    {/if}

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

<!-- Chat input - fixed at bottom like homepage -->
<div class="chat-input-container">
  <form class="input-row" on:submit|preventDefault={() => sendMessage()} autocomplete="off">
    <label for="content-chat-input" class="sr-only">Type your message</label>
    <input
      id="content-chat-input"
      class="chat-input"
      type="text"
      bind:value={input}
      bind:this={inputRef}
      placeholder="Ask about this content..."
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
    margin: 2rem auto 0 auto;
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

  .content-title {
    font-weight: 600;
    color: var(--color);
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

  .welcome-message {
    text-align: center;
    color: var(--grey-dark);
    padding: 2rem 1rem;
  }

  .welcome-message p {
    font-size: 1rem;
    margin: 0;
  }

  .welcome-message strong {
    color: var(--color);
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

  .content {
    word-break: break-word;
  }

  /* Chat input - positioned independently like homepage */
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
    padding: 0.25rem;
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
