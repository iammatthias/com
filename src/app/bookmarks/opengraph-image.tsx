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
  // Font
  const NewYork = fetch(new URL("./../fonts/NewYork.ttf", import.meta.url)).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          textAlign: "center",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          flexWrap: "nowrap",
          backgroundColor: "#eeeeee",
        }}>
        <div
          style={{
            content: "",
            display: "flex",
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "#eeeeee",
            backgroundImage:
              "radial-gradient(circle at 5px 5px, #f06900 4%, transparent 0%), radial-gradient(circle at 15px 15px, #f06900 4%, transparent 0%)",
            backgroundSize: "20px 20px",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            bottom: 40,
            right: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <div
            style={{
              content: "",
              display: "flex",
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: "#eeeeee",
            }}
          />

          <MoonSunMoon />
          <div
            style={{
              display: "flex",
              fontSize: 48,
              fontStyle: "normal",
              color: "black",
              marginTop: 16,
              lineHeight: 1,
              whiteSpace: "pre-wrap",
            }}>
            I Am Matthias
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontStyle: "normal",
              fontWeight: "bold",
              color: "black",
              marginTop: 32,
              lineHeight: 1,
              whiteSpace: "pre-wrap",
            }}>
            Bookmarks
          </div>
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
      fonts: [
        {
          name: "NewYork",
          data: await NewYork,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
