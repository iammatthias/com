export const prerender = false;

import satori from "satori";
import { html } from "satori-html";
import { Resvg } from "@resvg/resvg-js";

export async function GET({ params }) {
  console.log("Original params.og:", params.og);

  // Remove "og-" prefix if present (case-insensitive)
  const cleanOg = params.og.toLowerCase().startsWith("og-") ? params.og.substring(3) : params.og;
  console.log("After prefix removal:", cleanOg);

  // Extract path and title
  const parts = cleanOg.split("-");
  let path = parts[0];
  const title = parts.length > 1 ? decodeURIComponent(parts[1].replace(/\+/g, " ")) : undefined;

  // Simple decode for path
  path = path.replace(/&amp;/g, "&");
  console.log("Final path:", path);
  console.log("Title:", title);

  // fetch fonts to array buffer
  const font = await fetch(
    "https://github.com/ateliertriay/bricolage/raw/refs/heads/main/fonts/ttf/BricolageGrotesque-ExtraBold.ttf"
  );
  const buffer = await font.arrayBuffer();

  let markup: ReturnType<typeof html>;

  if (path && !title) {
    markup = html`
      <div
        style="
          width: 100%;
          height: 100%;
          display: flex;
          color: rgba(10, 10, 10, 1);
          padding: 48px;
          background-color: rgba(241, 241, 241, 1);
      "
      >
        <div
          style="
          width: 100%;
          height: 100%;
          border: 8px solid rgba(255, 187, 0, 1);
          border-radius: 48px;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          "
        >
          <div style="font-size: 48px; display: flex">@iammatthias</div>

          <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <div style="font-size: 64px; display: flex; text-transform: capitalize;">${path}</div>
          </div>
        </div>
      </div>
    `;
  } else if (title) {
    markup = html`
      <div
        style="
          width: 100%;
          height: 100%;
          display: flex;
          color: rgba(26, 26, 26, 1);
          padding: 48px;
          background-color: rgba(241, 241, 241, 1);
      "
      >
        <div
          style="
          width: 100%;
          height: 100%;
          border: 8px solid rgb(255, 187, 0);
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          "
        >
          <div style="font-size: 48px; display: flex">@iammatthias</div>

          <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <div style="font-size: 32px; display: flex; text-transform: capitalize;">${path}</div>
            <div style="font-size: 64px; display: flex">${title}</div>
          </div>
        </div>
      </div>
    `;
  } else {
    markup = html`
      <div
        style="
          width: 100%;
          height: 100%;
          display: flex;
          color: rgba(26, 26, 26, 1);
          padding: 48px;
          background-color: rgba(241, 241, 241, 1);
      "
      >
        <div
          style="
          width: 100%;
          height: 100%;
          border: 8px solid rgb(255, 187, 0);
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          "
        >
          <div style="font-size: 64px; display: flex">@iammatthias</div>
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
        name: "Bricolage Grotesque",
        data: buffer,
        style: "normal",
      },
    ],
  });

  const resvg = new Resvg(svg);

  return new Response(resvg.render().asPng(), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
    },
  });
}
