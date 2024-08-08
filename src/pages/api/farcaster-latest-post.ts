import type { APIRoute } from "astro";

export const prerender = false;

const AIRSTACK_API_KEY = import.meta.env.AIRSTACK_API_KEY;

interface AirstackResponse {
  data: {
    FarcasterCasts: {
      Cast: {
        castedAtTimestamp: string;
        url: string;
        text: string;
        castedBy: {
          profileName: string;
          profileDisplayName: string;
          profileImage: string;
        };
        embeds: string[];
        numberOfLikes: number;
        numberOfRecasts: number;
        numberOfReplies: number;
        channel: {
          name: string;
        } | null;
      }[];
    };
  };
}

export const GET: APIRoute = async ({ request }) => {
  const query = `
    query LatestCast($limit: Int = 1, $_eq: Identity = "fc_fname:iammatthias") {
      FarcasterCasts(
        input: {filter: {castedBy: {_eq: $_eq}}, blockchain: ALL, limit: $limit}
      ) {
        Cast {
          castedAtTimestamp
          url
          text
          castedBy {
            profileName
            profileDisplayName
            profileImage
          } 
          embeds
          numberOfLikes
          numberOfRecasts
          numberOfReplies
          channel {
            name
          }
        }
      }
    }
  `;

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: AIRSTACK_API_KEY || "",
    },
    body: JSON.stringify({ query }),
  };

  try {
    const response = await fetch("https://api.airstack.xyz/gql", options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AirstackResponse = await response.json();

    if (
      !data.data.FarcasterCasts.Cast ||
      data.data.FarcasterCasts.Cast.length === 0
    ) {
      throw new Error("No casts found");
    }

    const cast = data.data.FarcasterCasts.Cast[0];
    const processedData = {
      author: {
        displayName: cast.castedBy.profileDisplayName,
        username: cast.castedBy.profileName,
        pfpUrl: cast.castedBy.profileImage,
        followerCount: 0,
        followingCount: 0,
        bio: "",
      },
      cast: {
        text: cast.text,
        timestamp: cast.castedAtTimestamp,
        hash: cast.url.split("/").pop() || "",
        reactionCount: cast.numberOfLikes,
        recastCount: cast.numberOfRecasts,
        replyCount: cast.numberOfReplies,
      },
      channel: cast.channel
        ? {
            name: cast.channel.name,
            imageUrl: "",
          }
        : null,
      embed:
        cast.embeds && cast.embeds.length > 0
          ? cast.embeds.map((embed) => ({
              url: embed,
            }))
          : null,
    };

    return new Response(JSON.stringify({ postData: processedData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching Farcaster data:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch Farcaster data",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
