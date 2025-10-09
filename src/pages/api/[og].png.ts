export const prerender = false;

import satori from "satori";
import { html } from "satori-html";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

  // Load local New York font (matches site typography)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const fontPath = join(__dirname, "..", "..", "..", "public", "fonts", "new-york-medium_regular.ttf");
  const buffer = readFileSync(fontPath);

  // Generate markup based on what we have
  let markup: ReturnType<typeof html>;

  if (!path && !title) {
    // Homepage
    markup = html`
      <div
        style="width: 100%; height: 100%; display: flex; background: ${COLORS.background}; border: 2px solid ${COLORS.accent};"
      >
        <div
          style="width: 100%; height: 100%; padding: 64px; display: flex; align-items: center; justify-content: center;"
        >
          <div style="font-size: 72px; color: ${COLORS.foreground};">@iammatthias</div>
        </div>
      </div>
    `;
  } else if (path && !title) {
    // Category page
    markup = html`
      <div
        style="width: 100%; height: 100%; display: flex; background: ${COLORS.background}; border: 2px solid ${COLORS.accent};"
      >
        <div
          style="width: 100%; height: 100%; padding: 64px; display: flex; flex-direction: column; justify-content: space-between;"
        >
          <div style="font-size: 42px; color: ${COLORS.foreground}; opacity: 0.8;">@iammatthias</div>
          <div style="font-size: 84px; color: ${COLORS.foreground}; text-transform: capitalize;">${path}</div>
        </div>
      </div>
    `;
  } else {
    // Content page
    markup = html`
      <div
        style="width: 100%; height: 100%; display: flex; background: ${COLORS.background}; border: 2px solid ${COLORS.accent};"
      >
        <div
          style="width: 100%; height: 100%; padding: 64px; display: flex; flex-direction: column; justify-content: space-between;"
        >
          <div style="font-size: 42px; color: ${COLORS.foreground}; opacity: 0.8;">@iammatthias</div>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="font-size: 28px; color: ${COLORS.accent}; text-transform: capitalize;">${path}</div>
            <div style="font-size: 64px; color: ${COLORS.foreground};">${title}</div>
          </div>
        </div>
      </div>
    `;
  }

  // @ts-ignore
  const svg = await satori(markup, {
    width: 1200,
    height: 628,
    fonts: [
      {
        name: "New York",
        data: buffer,
        style: "normal",
      },
    ],
  });

  const resvg = new Resvg(svg);
  const pngBuffer = resvg.render().asPng();

  return new Response(new Uint8Array(pngBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
    },
  });
}
