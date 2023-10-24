import MoonSunMoon from "@/components/moon_sun_moon";

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
export default async function Image() {
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
            gap: 24,
          }}>
          <MoonSunMoon />
          <div>I AM MATTHIAS</div>
        </div>
        <div
          style={{
            fontSize: 32,
            lineHeight: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 24,
          }}>
          Resume
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
