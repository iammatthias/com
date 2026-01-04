import { useEffect, useState } from "react";
import "./SocialFeeds.css";

// Shared types
interface BasePost {
  createdAt: string;
  text: string;
  postUrl: string;
}

// Bluesky types
interface BlueskyImage {
  type: "image";
  thumb: string;
  fullsize: string;
  alt: string;
  mimeType: string;
}

interface BlueskyVideo {
  type: "video";
  url: string;
  mimeType: string;
}

interface BlueskyExternal {
  type: "external";
  uri: string;
  title: string;
  description: string;
  thumb?: string;
}

interface BlueskyQuote {
  type: "quote";
  uri: string;
  cid: string;
}

type BlueskyEmbed =
  | BlueskyImage
  | BlueskyVideo
  | BlueskyExternal
  | BlueskyQuote;

interface BlueskyPost extends BasePost {
  uri: string;
  cid: string;
  embeds: BlueskyEmbed[];
}

// Farcaster types
interface FarcasterEmbed {
  type: "url" | "cast";
  url?: string;
  castFid?: number;
  castHash?: string;
}

interface FarcasterPost extends BasePost {
  hash: string;
  embeds: FarcasterEmbed[];
}

// 5 days in milliseconds
const STALE_THRESHOLD_MS = 5 * 24 * 60 * 60 * 1000;

function isPostStale(post: BasePost): boolean {
  const postTime = new Date(post.createdAt).getTime();
  return Date.now() - postTime > STALE_THRESHOLD_MS;
}

function filterFreshPosts<T extends BasePost>(posts: T[]): T[] {
  return posts.filter((post) => !isPostStale(post));
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
  // Check for common image extensions
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return true;
  // Check for known image CDNs
  if (url.includes("imagedelivery.net")) return true;
  if (url.includes("i.imgur.com")) return true;
  if (url.includes("pbs.twimg.com")) return true;
  return false;
}

// Bluesky post card
function BlueskyPostCard({ post }: { post: BlueskyPost }) {
  const images = post.embeds.filter(
    (e): e is BlueskyImage => e.type === "image",
  );
  const otherEmbeds = post.embeds.filter((e) => e.type !== "image");

  return (
    <article className="social-post">
      <a
        href={post.postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="social-post-link"
      >
        <time className="social-time" dateTime={post.createdAt}>
          {formatDate(post.createdAt)}
        </time>
        {post.text && <p className="social-text">{post.text}</p>}
      </a>

      {images.length > 0 && (
        <div
          className={`social-images social-images-${Math.min(images.length, 4)}`}
        >
          {images.map((img, i) => (
            <a
              key={i}
              href={img.fullsize}
              target="_blank"
              rel="noopener noreferrer"
              className="social-image"
            >
              <img src={img.thumb} alt={img.alt} loading="lazy" />
            </a>
          ))}
        </div>
      )}

      {otherEmbeds.map((embed, i) => {
        if (embed.type === "video") {
          return (
            <div key={i} className="social-video">
              <video controls preload="metadata">
                <source src={embed.url} type={embed.mimeType} />
              </video>
            </div>
          );
        }
        if (embed.type === "external") {
          return (
            <a
              key={i}
              href={embed.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="social-external"
            >
              {embed.thumb && (
                <img
                  src={embed.thumb}
                  alt=""
                  className="social-external-thumb"
                  loading="lazy"
                />
              )}
              <div className="social-external-content">
                <span className="social-external-title">{embed.title}</span>
                <span className="social-external-uri">
                  {new URL(embed.uri).hostname}
                </span>
              </div>
            </a>
          );
        }
        if (embed.type === "quote") {
          const uriParts = embed.uri.split("/");
          const postId = uriParts[uriParts.length - 1];
          const did = uriParts[2];
          return (
            <a
              key={i}
              href={`https://bsky.app/profile/${did}/post/${postId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-quote"
            >
              Quoted post
            </a>
          );
        }
        return null;
      })}
    </article>
  );
}

// Farcaster post card
function FarcasterPostCard({ post }: { post: FarcasterPost }) {
  const imageEmbeds = post.embeds.filter(
    (e) => e.type === "url" && e.url && isImageUrl(e.url),
  );
  const otherEmbeds = post.embeds.filter(
    (e) => !(e.type === "url" && e.url && isImageUrl(e.url)),
  );

  return (
    <article className="social-post">
      <a
        href={post.postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="social-post-link"
      >
        <time className="social-time" dateTime={post.createdAt}>
          {formatDate(post.createdAt)}
        </time>
        {post.text && <p className="social-text">{post.text}</p>}
      </a>

      {imageEmbeds.length > 0 && (
        <div
          className={`social-images social-images-${Math.min(imageEmbeds.length, 4)}`}
        >
          {imageEmbeds.map((embed, i) => (
            <a
              key={i}
              href={embed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-image"
            >
              <img src={embed.url} alt="" loading="lazy" />
            </a>
          ))}
        </div>
      )}

      {otherEmbeds.map((embed, i) => {
        if (embed.type === "url" && embed.url) {
          return (
            <a
              key={i}
              href={embed.url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
            >
              {new URL(embed.url).hostname}
            </a>
          );
        }
        if (embed.type === "cast" && embed.castHash) {
          const hashHex = embed.castHash.startsWith("0x")
            ? embed.castHash.slice(2)
            : embed.castHash;
          return (
            <a
              key={i}
              href={`https://warpcast.com/~/conversations/${hashHex}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-quote"
            >
              Quoted cast
            </a>
          );
        }
        return null;
      })}
    </article>
  );
}

interface SocialFeedsProps {
  limit?: number;
}

export default function SocialFeeds({ limit = 10 }: SocialFeedsProps) {
  const [blueskyPosts, setBlueskyPosts] = useState<BlueskyPost[]>([]);
  const [farcasterPosts, setFarcasterPosts] = useState<FarcasterPost[]>([]);
  const [blueskyLoading, setBlueskyLoading] = useState(true);
  const [farcasterLoading, setFarcasterLoading] = useState(true);

  useEffect(() => {
    // Fetch Bluesky
    fetch(`/api/bluesky.json?limit=${limit}&_=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => setBlueskyPosts(data))
      .catch((err) => console.error("Bluesky error:", err))
      .finally(() => setBlueskyLoading(false));

    // Fetch Farcaster
    fetch(`/api/farcaster.json?limit=${limit}&_=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => setFarcasterPosts(data))
      .catch((err) => console.error("Farcaster error:", err))
      .finally(() => setFarcasterLoading(false));
  }, [limit]);

  const isLoading = blueskyLoading || farcasterLoading;

  // Filter to only fresh posts (within last 5 days)
  const freshBlueskyPosts = filterFreshPosts(blueskyPosts);
  const freshFarcasterPosts = filterFreshPosts(farcasterPosts);

  const blueskyActive = !blueskyLoading && freshBlueskyPosts.length > 0;
  const farcasterActive = !farcasterLoading && freshFarcasterPosts.length > 0;

  if (isLoading) {
    return <div className="social-loading">Loading social feeds...</div>;
  }

  if (!blueskyActive && !farcasterActive) {
    return null; // No active feeds
  }

  return (
    <div
      className={`social-feeds ${blueskyActive && farcasterActive ? "social-feeds-two" : "social-feeds-one"}`}
    >
      {blueskyActive && (
        <details className="social-column" open>
          <summary>Bluesky</summary>
          <div className="social-feed">
            {freshBlueskyPosts.map((post) => (
              <BlueskyPostCard key={post.cid} post={post} />
            ))}
          </div>
          <div className="social-view-all">
            <a
              href="https://bsky.app/profile/iammatthias.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              View more on Bluesky →
            </a>
          </div>
        </details>
      )}

      {farcasterActive && (
        <details className="social-column" open>
          <summary>Farcaster</summary>
          <div className="social-feed">
            {freshFarcasterPosts.map((post) => (
              <FarcasterPostCard key={post.hash} post={post} />
            ))}
          </div>
          <div className="social-view-all">
            <a
              href="https://warpcast.com/iammatthias"
              target="_blank"
              rel="noopener noreferrer"
            >
              View more on Warpcast →
            </a>
          </div>
        </details>
      )}
    </div>
  );
}
