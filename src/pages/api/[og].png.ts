export const prerender = false;

import satori from "satori";
import { html } from "satori-html";
import { Resvg } from "@resvg/resvg-js";

export async function GET({ params }) {
  console.log("Original params.og:", params.og);

  // Handle the default homepage case where params.og is just "og"
  if (params.og === "og") {
    console.log("Homepage default OG image");

    // fetch fonts to array buffer
    const font = await fetch(
      "https://github.com/ateliertriay/bricolage/raw/refs/heads/main/fonts/ttf/BricolageGrotesque-ExtraBold.ttf"
    );
    const buffer = await font.arrayBuffer();

    const markup = html`
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
          border: 2px solid rgb(255, 187, 0);
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

  // Remove "og-" prefix if present (case-insensitive)
  const cleanOg = params.og.toLowerCase().startsWith("og-") ? params.og.substring(3) : params.og;
  console.log("After prefix removal:", cleanOg);

  // Extract path and title - split only on the first dash to handle dashes in titles
  const firstDashIndex = cleanOg.indexOf("-");
  let path: string;
  let title: string | undefined;

  if (firstDashIndex === -1) {
    // No dash found, just path
    path = cleanOg;
    title = undefined;
  } else {
    // Split on first dash only
    path = cleanOg.substring(0, firstDashIndex);
    title = decodeURIComponent(cleanOg.substring(firstDashIndex + 1).replace(/\+/g, " "));
  }

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
          border: 4px solid rgba(255, 187, 0, 1);
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
          border: 4px solid rgb(255, 187, 0);
          border-radius: 48px;
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
          border: 4px solid rgb(255, 187, 0);
          border-radius: 48px;
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
