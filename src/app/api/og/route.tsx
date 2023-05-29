import { ImageResponse } from "next/server";
// App router includes @vercel/og.
// No need to install it.

export const runtime = "edge";

export async function GET() {
  // Image metadata
  const siteTitle = "I AM MATTHIAS";
  const siteDescription = "A digital garden";
  const size = {
    width: 1200,
    height: 630,
  };

  // fonts
  const fontNewYork = fetch(new URL("./NewYork.ttf", import.meta.url)).then(
    (res) => res.arrayBuffer()
  );
  const fontSubset = fetch(new URL("./subset.ttf", import.meta.url)).then(
    (res) => res.arrayBuffer()
  );

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
            backgroundImage: "linear-gradient(to bottom, #eaeff0, #fff)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "8px",
            padding: 64,
            fontFamily: "NewYork",
          }}>
          <p
            style={{
              margin: 0,
              padding: 0,
              fontSize: 24,
              fontFamily: "Subset",
            }}>
            ☾ ☼ ☽
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <h1
              style={{
                margin: 0,
                padding: 0,
                fontSize: 48,
                letterSpacing: 2,
              }}>
              {siteTitle}
            </h1>
            {siteDescription && (
              <p
                style={{
                  margin: 0,
                  padding: 0,
                  fontSize: 32,
                }}>
                {siteDescription}
              </p>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
      fonts: [
        {
          name: "NewYork",
          data: await fontNewYork,
          style: "normal",
          weight: 400,
        },
        {
          name: "Subset",
          data: await fontSubset,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
