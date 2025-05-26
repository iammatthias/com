<script lang="ts">
  import { onMount } from "svelte";
  import { tick } from "svelte";

  // Types
  type Role = "user" | "assistant";
  interface Message {
    role: Role;
    content: string;
    context?: {
      title?: string;
      slug?: string;
      permalink?: string;
      published?: string;
      updated?: string;
      text?: string;
      score?: number;
      file_id?: string;
      cid?: string;
    }[];
  }
  interface ChatResponse {
    answer: string;
    context: { title?: string; slug?: string; permalink?: string; published?: string; updated?: string }[];
  }

  let messages: Message[] = [];
  let input = "";
  let loading = false;
  let error: string | null = null;
  let showContext: boolean[] = [false];
  let inputRef: HTMLInputElement | null = null;
  let chatEndRef: HTMLDivElement | null = null;

  // Suggested prompts
  // cover posts, notes, recipes, art, open source projects, etc
  const prompts = ["What are your recent posts?", "What are your recent recipes?", "Tell me about your recent work"];

  function scrollToBottom() {
    if (chatEndRef) chatEndRef.scrollIntoView({ behavior: "smooth" });
  }

  async function sendMessage(messageOverride?: string) {
    error = null;
    const trimmed = (messageOverride !== undefined ? messageOverride : input).trim();
    if (!trimmed || loading) return;
    messages = [...messages, { role: "user", content: trimmed }];
    input = "";
    loading = true;
    showContext = [...showContext, false];
    try {
      const res = await fetch("/api/rag-chat.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));

        // Handle blocked messages differently than other errors
        if (err.blocked) {
          // Remove the user message that was blocked
          messages = messages.slice(0, -1);
          showContext = showContext.slice(0, -1);
          // Show the suggestion as a helpful message
          error = err.error || "This question isn't something I can help with.";
          return;
        }

        throw new Error(err.error || "Unknown error");
      }
      const data: ChatResponse = await res.json();
      console.log("[FRONTEND] Received response:", data);
      console.log("[FRONTEND] Context received:", data.context);
      console.log("[FRONTEND] Context length:", data.context?.length || 0);
      messages = [...messages, { role: "assistant", content: data.answer, context: data.context }];
      showContext = [...showContext, false];
      await tick();
    } catch (e) {
      // Remove the user message for non-blocked errors too
      messages = messages.slice(0, -1);
      showContext = showContext.slice(0, -1);
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
      // Refocus the input after message processing completes
      await tick();
      inputRef?.focus();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function toggleContext(idx: number) {
    console.log(`[FRONTEND] Toggling context for message ${idx}`);
    console.log(`[FRONTEND] Message context:`, messages[idx]?.context);
    showContext = showContext.map((v, i) => (i === idx ? !v : v));
  }

  function handlePromptClick(prompt: string) {
    input = prompt;
    sendMessage(prompt);
  }

  onMount(async () => {
    // Focus input on mount
    if (inputRef) inputRef.focus();
  });

  // Scroll to bottom when messages change
  $: messages, scrollToBottom();

  // Simple markdown parser for chat messages
  function parseMarkdown(text: string): string {
    if (!text) return "";

    let html = text;

    // Escape HTML to prevent XSS
    html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Bold text (**text**) - be more specific to avoid conflicts
    html = html.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");

    // Italic text (*text*) - more careful to avoid bullet point conflicts
    html = html.replace(/(?<![\*\s])\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");

    // Inline code (`code`)
    html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");

    // Headers
    html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");

    // Handle bullet points and lists more carefully
    const lines = html.split("\n");
    const processedLines: string[] = [];
    let inList = false;
    let listType: "ul" | "ol" | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // More strict bullet point detection - must be at start of line
      const bulletMatch = trimmedLine.match(/^[*\-•]\s+(.+)$/);
      const numberMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);

      // Only treat as list item if it's actually meant to be one
      // (not just a stray * in the middle of text)
      if (bulletMatch && (i === 0 || lines[i - 1].trim() === "" || /^[*\-•]\s+/.test(lines[i - 1].trim()))) {
        if (!inList || listType !== "ul") {
          if (inList) processedLines.push(`</${listType}>`);
          processedLines.push("<ul>");
          inList = true;
          listType = "ul";
        }
        processedLines.push(`<li>${bulletMatch[1]}</li>`);
      } else if (numberMatch && (i === 0 || lines[i - 1].trim() === "" || /^\d+\.\s+/.test(lines[i - 1].trim()))) {
        if (!inList || listType !== "ol") {
          if (inList) processedLines.push(`</${listType}>`);
          processedLines.push("<ol>");
          inList = true;
          listType = "ol";
        }
        processedLines.push(`<li>${numberMatch[1]}</li>`);
      } else {
        if (inList) {
          processedLines.push(`</${listType}>`);
          inList = false;
          listType = null;
        }
        if (trimmedLine) {
          processedLines.push(line);
        } else {
          processedLines.push("");
        }
      }
    }

    // Close any remaining list
    if (inList) {
      processedLines.push(`</${listType}>`);
    }

    html = processedLines.join("\n");

    // Convert double line breaks to paragraph breaks
    html = html.replace(/\n\s*\n/g, "</p><p>");

    // Convert single line breaks to <br> tags, but not within lists or headers
    html = html.replace(/(?<!<\/li>)\n(?!<[uo]l>|<li>|<\/[uo]l>|<h[1-6]>)/g, "<br>");

    // Wrap in paragraphs if not starting with a block element
    if (!html.match(/^<(h[1-6]|ul|ol|p)/)) {
      html = "<p>" + html + "</p>";
    } else if (!html.startsWith("<p>") && !html.match(/^<(h[1-6]|ul|ol)/)) {
      html = "<p>" + html + "</p>";
    }

    // Clean up empty paragraphs and malformed content
    html = html.replace(/<p>\s*<\/p>/g, "");
    html = html.replace(/<p><br><\/p>/g, "");
    html = html.replace(/<p>\s*<br>\s*<\/p>/g, "");

    return html;
  }
</script>

<!-- DEBUG OUTPUTS -->
<!-- <p style="color: red; font-size: 0.9em;">DEBUG: input = "{input}"</p>
<p style="color: red; font-size: 0.9em;">DEBUG: loading = {loading ? "true" : "false"}</p> -->

<div class="chat-container" aria-label="RAG Chat Interface">
  <div class="messages" role="log" aria-live="polite">
    {#each messages as msg, i}
      <div class="message {msg.role}">
        <div class="bubble">
          {#if msg.role === "assistant"}
            <span class="content">{@html parseMarkdown(msg.content)}</span>
          {:else}
            <span class="content">{msg.content}</span>
          {/if}
        </div>
        {#if msg.role === "assistant" && msg.context}
          <button
            class="context-toggle"
            aria-expanded={showContext[i]}
            aria-controls={`context-${i}`}
            on:click={() => toggleContext(i)}
          >
            {showContext[i] ? "Hide context" : "Show context"}
          </button>
          {#if showContext[i]}
            <div class="context" id={`context-${i}`}>
              <ul>
                {#each msg.context as ctx}
                  <li>
                    {#if ctx.permalink}
                      <a href={ctx.permalink} target="_blank" rel="noopener noreferrer">{ctx.permalink}</a>
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        {/if}
      </div>
    {/each}
    {#if loading}
      <div class="message assistant">
        <div class="bubble">
          <span class="loader"></span>
        </div>
      </div>
    {/if}
    <div tabindex="-1" aria-hidden="true" bind:this={chatEndRef}></div>
  </div>
  {#if error}
    <div class="error" role="alert">{error}</div>
  {/if}
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
</div>

<style>
  .chat-container {
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 1rem 0;
  }

  /* Minimal, color-scheme-respecting chat style */
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 1rem;
    margin-top: auto;
  }
  .messages {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0 0.5rem;
  }
  .message {
    outline: none;
    margin-bottom: 0.5rem;
  }
  .bubble {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    border-left: 4px solid var(--gold); /* Subtle accent for all messages */
    border-radius: 0.25rem;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    word-break: break-word;
    background: transparent; /* No colored background */
    color: var(--color);
    box-shadow: none;
    border-top: none;
    border-bottom: none;
    border-right: none;
  }
  .message.user .bubble {
    border-left: 4px solid var(--blue); /* User accent */
    font-weight: 500;
  }
  .message.assistant .bubble {
    border-left: 4px solid var(--gold); /* Assistant accent */
    font-weight: 400;
  }
  .role-label {
    font-weight: bold;
    margin-right: 0.5em;
    color: var(--blue);
  }

  .context-toggle {
    margin-top: 0.25rem;
    background: none;
    border: none;
    color: var(--link-color-light);
    cursor: pointer;
    font-size: 0.95em;
    text-decoration: underline;
    padding: 0;
    transition: color 0.2s;
  }
  .context-toggle:hover {
    color: var(--link-hover-color-light);
  }
  .context {
    background: var(--grey-light);
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    margin-top: 0.25rem;
    font-size: 0.95em;
    color: var(--color);
  }
  .context a {
    color: var(--link-color-light);
    text-decoration: underline;
  }
  .context a:hover {
    color: var(--link-hover-color-light);
  }
  .input-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-top: auto;
  }

  .chat-input-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: sticky;
    bottom: 0;
    background: var(--background);
    z-index: 100;
    padding: 0 0 1rem;
  }

  .chat-input {
    flex: 1 1 auto;
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
  .error {
    color: var(--terracotta-darker);
    background: var(--terracotta-lighter);
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    text-align: center;
    font-size: 1rem;
    border: var(--border);
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
    padding: 0;
    border: none;
    border-radius: 0;
    padding: 0.25rem;
    background: light-dark(var(--grey-light), var(--grey-dark));
    color: light-dark(var(--grey-dark), var(--grey-light));
  }
  .prompt-btn:hover {
    background: #e0e0e0;
    color: var(--black);
  }
  @media (max-width: 600px) {
    .chat-container {
      padding: 0.5rem;
      min-height: 70vh;
    }
    .bubble {
      font-size: 0.97rem;
      padding: 0.6rem 0.8rem;
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
    margin-top: 4px;
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
