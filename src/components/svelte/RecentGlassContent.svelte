<script lang="ts">
  import { onMount } from "svelte";

  // Props
  export let contentLimit: number = 10;

  // Types
  interface GlassEntry {
    type: "glass";
    width: number;
    height: number;
    src: string;
    share_url: string;
  }

  interface GlassData {
    id: string;
    width: number;
    height: number;
    image640x640: string;
    share_url: string;
    created_at: string;
  }

  // State
  let glassEntries: GlassEntry[] = [];
  let isLoading = true;
  let error: string | null = null;

  // Type guard function
  const isValidGlassEntry = (entry: any): entry is GlassData => {
    return entry?.image640x640 && entry?.width && entry?.height && entry?.share_url;
  };

  onMount(async () => {
    try {
      isLoading = true;
      error = null;

      // Fetch glass data from API endpoint with content limit
      const response = await fetch(`/api/glass.json?limit=${contentLimit}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch glass data: ${response.statusText}`);
      }

      const data = await response.json();

      // Process glass entries efficiently (similar to original Astro logic)
      glassEntries = (data || []).filter(isValidGlassEntry).map(
        (entry: GlassData): GlassEntry => ({
          type: "glass",
          width: entry.width,
          height: entry.height,
          src: entry.image640x640,
          share_url: entry.share_url,
        })
      );
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load glass content";
      console.error("Error loading glass content:", err);
    } finally {
      isLoading = false;
    }
  });
</script>

{#if isLoading}
  <div class="loading">Loading glass content...</div>
{:else if error}
  <div class="error">Error: {error}</div>
{:else if glassEntries.length > 0}
  {#each glassEntries as entry}
    <div class="glass-content">
      <a href={entry.share_url} target="_blank" rel="noopener noreferrer">
        <img
          src={entry.src}
          width={entry.width}
          height={entry.height}
          alt="A post originally published on Glass"
          loading="lazy"
        />
      </a>
    </div>
  {/each}
{:else}
  <div class="no-content">No glass content available</div>
{/if}

<style>
  .glass-content {
    display: block;
    line-height: 0;
    aspect-ratio: 6/7;
    object-fit: cover;
    overflow: hidden;
  }

  .glass-content img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .loading {
    text-align: center;
    color: var(--grey);
    font-size: 1rem;
    padding: 2rem;
  }

  .error {
    color: var(--terracotta-darker);
    background: var(--terracotta-lighter);
    padding: 1rem;
    border-radius: 0.5rem;
    text-align: center;
    font-size: 0.9rem;
    border: var(--border);
  }

  .no-content {
    text-align: center;
    color: var(--grey);
    font-size: 0.9rem;
    padding: 1rem;
  }
</style>
