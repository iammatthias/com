import { ImageResponse } from "next/server";
// App router includes @vercel/og.
// No need to install it.

export const runtime = "edge";

// Image metadata
export const title = "I AM MATTHIAS";
export const description = "A digital garden";
export const alt = "A digital portfolio";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Make sure the font exists in the specified path:
const font = fetch(new URL("../../assets/NewYork.ttf", import.meta.url)).then(
  (res) => res.arrayBuffer()
);

export async function GET() {
  const fontData = await font;

  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: "#EAEFF0",
          width: "100%",
          height: "100%",
          padding: "31px",
          display: "flex",
        }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            border: "1px solid #d4af37",
            borderRadius: "4px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: "NewYork",
          }}>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
      fonts: [
        {
          name: "NewYork",
          data: fontData,
          style: "normal",
        },
      ],
    }
  );
}
