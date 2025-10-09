export const prerender = false;

import { ImageResponse } from "@cloudflare/pages-plugin-vercel-og/api";
import type { JSX } from "react";

// RGB colors converted from display-p3 values in globals.css
const COLORS = {
  background: "rgb(15, 20, 25)",
  foreground: "rgb(242, 250, 239)",
  accent: "rgb(255, 191, 0)",
};

export async function GET({ params }: any) {
  // Parse the OG image request
  let path: string | undefined;
  let title: string | undefined;

  if (params.og === "og") {
    // Homepage - no path or title
    path = undefined;
    title = undefined;
  } else {
    // Remove "og-" prefix if present
    const cleanOg = params.og.toLowerCase().startsWith("og-") ? params.og.substring(3) : params.og;

    // Split on first dash to get path and title
    const firstDashIndex = cleanOg.indexOf("-");
    if (firstDashIndex === -1) {
      path = cleanOg;
      title = undefined;
    } else {
      path = cleanOg.substring(0, firstDashIndex);
      title = decodeURIComponent(cleanOg.substring(firstDashIndex + 1));
    }
  }

  // Load local New York font
  const fontUrl = new URL("/fonts/new-york-medium_regular.ttf", import.meta.url);
  const fontData = await fetch(fontUrl);
  const fontBuffer = await fontData.arrayBuffer();

  // Generate JSX based on what we have
  let content: JSX.Element;

  if (!path && !title) {
    // Homepage
    content = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: COLORS.background,
          border: `2px solid ${COLORS.accent}`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "72px", color: COLORS.foreground }}>@iammatthias</div>
        </div>
      </div>
    );
  } else if (path && !title) {
    // Category page
    content = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: COLORS.background,
          border: `2px solid ${COLORS.accent}`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "64px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "42px", color: COLORS.foreground, opacity: 0.8 }}>@iammatthias</div>
          <div style={{ fontSize: "84px", color: COLORS.foreground, textTransform: "capitalize" }}>{path}</div>
        </div>
      </div>
    );
  } else {
    // Content page
    content = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: COLORS.background,
          border: `2px solid ${COLORS.accent}`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "64px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "42px", color: COLORS.foreground, opacity: 0.8 }}>@iammatthias</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontSize: "28px", color: COLORS.accent, textTransform: "capitalize" }}>{path}</div>
            <div style={{ fontSize: "64px", color: COLORS.foreground }}>{title}</div>
          </div>
        </div>
      </div>
    );
  }

  return new ImageResponse(content, {
    width: 1200,
    height: 628,
    fonts: [
      {
        name: "New York",
        data: fontBuffer,
        style: "normal",
      },
    ],
  });
}
