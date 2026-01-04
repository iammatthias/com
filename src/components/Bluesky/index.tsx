import { useEffect, useState } from "react";
import "./Bluesky.css";

// Types matching the API response
interface NormalizedImage {
  type: "image";
  thumb: string;
  fullsize: string;
  alt: string;
  aspectRatio?: { width: number; height: number };
  mimeType: string;
}

interface NormalizedVideo {
  type: "video";
  url: string;
  alt?: string;
  aspectRatio?: { width: number; height: number };
  mimeType: string;
}

interface NormalizedExternal {
  type: "external";
  uri: string;
  title: string;
  description: string;
  thumb?: string;
}

interface NormalizedQuote {
  type: "quote";
  uri: string;
  cid: string;
}

type NormalizedEmbed =
  | NormalizedImage
  | NormalizedVideo
  | NormalizedExternal
  | NormalizedQuote;

interface BlueskyPost {
  uri: string;
  cid: string;
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

function ImageEmbed({ embed }: { embed: NormalizedImage }) {
  return (
    <a
      href={embed.fullsize}
      target="_blank"
      rel="noopener noreferrer"
      className="bsky-image"
    >
      <img src={embed.thumb} alt={embed.alt} loading="lazy" />
    </a>
  );
}

function VideoEmbed({ embed }: { embed: NormalizedVideo }) {
  return (
    <div className="bsky-video">
      <video controls preload="metadata">
        <source src={embed.url} type={embed.mimeType} />
        Your browser does not support this video format.
      </video>
      {embed.alt && <span className="bsky-video-alt">{embed.alt}</span>}
    </div>
  );
}

function ExternalEmbed({ embed }: { embed: NormalizedExternal }) {
  return (
    <a
      href={embed.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="bsky-external"
    >
      {embed.thumb && (
        <img
          src={embed.thumb}
          alt=""
          className="bsky-external-thumb"
          loading="lazy"
        />
      )}
      <div className="bsky-external-content">
        <span className="bsky-external-title">{embed.title}</span>
        <span className="bsky-external-description">{embed.description}</span>
        <span className="bsky-external-uri">{new URL(embed.uri).hostname}</span>
      </div>
    </a>
  );
}

function QuoteEmbed({ embed }: { embed: NormalizedQuote }) {
  // Extract handle/postId from URI: at://did:plc:xxx/app.bsky.feed.post/postid
  const uriParts = embed.uri.split("/");
  const postId = uriParts[uriParts.length - 1];
  const did = uriParts[2];

  return (
    <a
      href={`https://bsky.app/profile/${did}/post/${postId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="bsky-quote"
    >
      <span className="bsky-quote-label">Quoted post</span>
    </a>
  );
}

function EmbedRenderer({ embed }: { embed: NormalizedEmbed }) {
  switch (embed.type) {
    case "image":
      return <ImageEmbed embed={embed} />;
    case "video":
      return <VideoEmbed embed={embed} />;
    case "external":
      return <ExternalEmbed embed={embed} />;
    case "quote":
      return <QuoteEmbed embed={embed} />;
    default:
      return null;
  }
}

function PostCard({ post }: { post: BlueskyPost }) {
  // Group images together for grid layout
  const images = post.embeds.filter(
    (e): e is NormalizedImage => e.type === "image",
  );
  const otherEmbeds = post.embeds.filter((e) => e.type !== "image");

  return (
    <article className="bsky-post">
      <a
        href={post.postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bsky-post-link"
      >
        <time className="bsky-time" dateTime={post.createdAt}>
          {formatDate(post.createdAt)}
        </time>
        {post.text && <p className="bsky-text">{post.text}</p>}
      </a>

      {images.length > 0 && (
        <div
          className={`bsky-images bsky-images-${Math.min(images.length, 4)}`}
        >
          {images.map((img, i) => (
            <ImageEmbed key={i} embed={img} />
          ))}
        </div>
      )}

      {otherEmbeds.map((embed, i) => (
        <EmbedRenderer key={i} embed={embed} />
      ))}
    </article>
  );
}

interface BlueskyFeedProps {
  limit?: number;
}

export default function BlueskyFeed({ limit = 10 }: BlueskyFeedProps) {
  const [posts, setPosts] = useState<BlueskyPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const response = await fetch(
          `/api/bluesky.json?limit=${limit}&_=${Date.now()}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: BlueskyPost[] = await response.json();
        console.log(
          "Bluesky posts received:",
          data.map((p) => ({
            text: p.text.slice(0, 30),
            createdAt: p.createdAt,
          })),
        );
        setPosts(data);
      } catch (error) {
        const msg =
          "Error fetching Bluesky posts: " +
          (error instanceof Error ? error.message : String(error));
        setErrorMsg(msg);
        console.error(msg);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPosts();
  }, [limit]);

  if (isLoading) {
    return (
      <div className="bsky-container">
        <div className="bsky-loading">Loading posts from Bluesky...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bsky-container">
        <div className="bsky-error">{errorMsg}</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bsky-container">
        <div className="bsky-empty">No posts found.</div>
      </div>
    );
  }

  return (
    <div className="bsky-container">
      <div className="bsky-feed">
        {posts.map((post) => (
          <PostCard key={post.cid} post={post} />
        ))}
      </div>
      <div className="bsky-view-all">
        <a
          href="https://bsky.app/profile/iammatthias.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          View more on Bluesky →
        </a>
      </div>
    </div>
  );
}
