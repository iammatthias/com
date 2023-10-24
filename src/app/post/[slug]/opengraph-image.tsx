import MoonSunMoon from "@/components/moon_sun_moon";
import { getObsidianEntry } from "@/lib/github";
import { ImageResponse } from "next/server";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "About Acme";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // const post = await getObsidianEntry(params.slug);

  const { name } = slug ? await getObsidianEntry(slug) : "";

  return new ImageResponse(
    (
      // ImageResponse JSX element

      <div
        style={{
          color: "rgb(29, 29, 29)",
          background: "rgb(253, 248, 240)",
          width: "100%",
          height: "100%",
          padding: 64,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: 48,
        }}>
        <div
          style={{
            fontSize: 48,
            lineHeight: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
          }}>
          <MoonSunMoon />
          <div>I AM MATTHIAS</div>
        </div>

        {name && (
          <div
            style={{
              fontSize: 32,
              lineHeight: "1.3em",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 24,
              maxWidth: "70%",
            }}>
            <span
              style={{
                backgroundImage: "linear-gradient(0deg, #f06900, #cd783e), linear-gradient(0deg, #db8d53, #dea067)",
                backgroundSize: "100% 4px, 0 4px",
                backgroundPosition: "100% 100%, 0 100%",
                backgroundRepeat: "no-repeat",
              }}>
              {name}
            </span>
          </div>
        )}
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
