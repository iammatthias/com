import satori from "satori";
import { html } from "satori-html";

export async function GET({ params, request }) {
  // const url = new URL(request.url);
  // const title = url.searchParams.get("title");
  // const path = url.searchParams.get("path");

  const parts = params.og.split("-");

  const path = parts[1];
  const title = parts[2];

  // fetch fonts to array buffer
  const font = await fetch(
    "https://github.com/fridamedrano/Kalnia-Typeface/raw/main/fonts/ttf/Kalnia-Bold.ttf",
  );
  const buffer = await font.arrayBuffer();

  let markup;

  if (path && !title) {
    markup = html`
      <div
        style="
          width: 100%;
          height: 100%;
          display: flex;
          color: rgba(10, 10, 10, 1);
          padding: 48px;
          background-color: rgba(242, 242, 242, 1);
      "
      >
        <div
          style="
          width: 100%;
          height: 100%;
          border: 8px solid rgba(240, 105, 0, 1);
          border-radius: 48px;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          "
        >
          <div style="font-size: 48px; display: flex">@iammatthias</div>

          <div
            style="display: flex; flex-direction: column; align-items: flex-start;"
          >
            <div style="font-size: 64px; display: flex">${path}</div>
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
          color: rgba(10, 10, 10, 1);
          padding: 48px;
          background-color: rgba(242, 242, 242, 1);
      "
      >
        <div
          style="
          width: 100%;
          height: 100%;
          border: 8px solid rgba(240, 105, 0, 1);
          border-radius: 48px;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          "
        >
          <div style="font-size: 48px; display: flex">@iammatthias</div>

          <div
            style="display: flex; flex-direction: column; align-items: flex-start;"
          >
            <div style="font-size: 48px; display: flex">${path}</div>
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
          color: rgba(10, 10, 10, 1);
          padding: 48px;
          background-color: rgba(242, 242, 242, 1);
      "
      >
        <div
          style="
          width: 100%;
          height: 100%;
          border: 8px solid rgba(240, 105, 0, 1);
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

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Kalnia",
        data: buffer,
        style: "normal",
      },
    ],
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
