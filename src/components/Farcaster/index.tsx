import { useEffect, useState } from "react";
import "./Farcaster.css";

interface NormalizedEmbed {
  type: "url" | "cast";
  url?: string;
  castFid?: number;
  castHash?: string;
}

interface FarcasterPost {
  hash: string;
  text: string;
  createdAt: string;
  embeds: NormalizedEmbed[];
  postUrl: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

function UrlEmbed({ url }: { url: string }) {
  if (isImageUrl(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="fc-image">
        <img src={url} alt="" loading="lazy" />
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="fc-link">
      {new URL(url).hostname}
    </a>
  );
}

function PostCard({ post }: { post: FarcasterPost }) {
  const imageEmbeds = post.embeds.filter((e) => e.type === "url" && e.url && isImageUrl(e.url));
  const otherEmbeds = post.embeds.filter((e) => !(e.type === "url" && e.url && isImageUrl(e.url)));

  return (
    <article className="fc-post">
      <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="fc-post-link">
        <time className="fc-time" dateTime={post.createdAt}>
          {formatDate(post.createdAt)}
        </time>
        {post.text && <p className="fc-text">{post.text}</p>}
      </a>

      {imageEmbeds.length > 0 && (
        <div className={`fc-images fc-images-${Math.min(imageEmbeds.length, 4)}`}>
          {imageEmbeds.map((embed, i) => (
            <UrlEmbed key={i} url={embed.url!} />
          ))}
        </div>
      )}

      {otherEmbeds.map((embed, i) => {
        if (embed.type === "url" && embed.url) {
          return <UrlEmbed key={i} url={embed.url} />;
        }
        if (embed.type === "cast" && embed.castHash) {
          const hashHex = embed.castHash.startsWith("0x") ? embed.castHash.slice(2) : embed.castHash;
          return (
            <a
              key={i}
              href={`https://warpcast.com/~/conversations/${hashHex}`}
              target="_blank"
              rel="noopener noreferrer"
              className="fc-quote"
            >
              <span className="fc-quote-label">Quoted cast</span>
            </a>
          );
        }
        return null;
      })}
    </article>
  );
}

interface FarcasterFeedProps {
  limit?: number;
  onDataLoaded?: (posts: FarcasterPost[]) => void;
}

export default function FarcasterFeed({ limit = 10, onDataLoaded }: FarcasterFeedProps) {
  const [posts, setPosts] = useState<FarcasterPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const response = await fetch(`/api/farcaster.json?limit=${limit}&_=${Date.now()}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: FarcasterPost[] = await response.json();
        setPosts(data);
        onDataLoaded?.(data);
      } catch (error) {
        const msg = "Error fetching Farcaster posts: " + (error instanceof Error ? error.message : String(error));
        setErrorMsg(msg);
        console.error(msg);
        onDataLoaded?.([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPosts();
  }, [limit]);

  if (isLoading) {
    return (
      <div className="fc-container">
        <div className="fc-loading">Loading casts from Farcaster...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="fc-container">
        <div className="fc-error">{errorMsg}</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null; // Return nothing if no posts (ephemeral behavior)
  }

  return (
    <div className="fc-container">
      <div className="fc-feed">
        {posts.map((post) => (
          <PostCard key={post.hash} post={post} />
        ))}
      </div>
      <div className="fc-view-all">
        <a href="https://warpcast.com/iammatthias" target="_blank" rel="noopener noreferrer">
          View more on Warpcast →
        </a>
      </div>
    </div>
  );
}
