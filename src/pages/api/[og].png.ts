import { renderToPng } from "../../lib/og-renderer";
import NewYorkFontData from "../../assets/fonts/new-york-medium_regular.ttf";

// RGB colors converted from display-p3 values in globals.css
const COLORS = {
  background: "rgb(15, 20, 25)",
  foreground: "rgb(242, 250, 239)",
  accent: "rgb(255, 191, 0)",
};

export const prerender = false;

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
    const cleanOg = params.og.toLowerCase().startsWith("og-")
      ? params.og.substring(3)
      : params.og;

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

  // Font data is loaded as Uint8Array by the rawFonts plugin
  const NewYorkFont = (NewYorkFontData as any).buffer || NewYorkFontData;

  // Generate HTML based on what we have
  let htmlContent: string;

  if (!path && !title) {
    // Homepage
    htmlContent = `
      <div style="
        display: flex;
        width: 1200px;
        height: 628px;
        background: ${COLORS.background};
        border: 2px solid ${COLORS.accent};
        padding: 60px;
        box-sizing: border-box;
        align-items: center;
        justify-content: center;
        font-family: 'New York', serif;
      ">
        <div style="
          display: flex;
          font-size: 72px;
          color: ${COLORS.foreground};
        ">
          @iammatthias
        </div>
      </div>
    `;
  } else if (path && !title) {
    // Category page
    htmlContent = `
      <div style="
        display: flex;
        width: 1200px;
        height: 628px;
        background: ${COLORS.background};
        border: 2px solid ${COLORS.accent};
        padding: 60px;
        box-sizing: border-box;
      ">
        <div style="
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          justify-content: space-between;
          font-family: 'New York', serif;
        ">
          <div style="
            font-size: 42px;
            color: ${COLORS.foreground};
            opacity: 0.8;
          ">
            @iammatthias
          </div>
          <div style="
            font-size: 84px;
            color: ${COLORS.foreground};
            text-transform: capitalize;
          ">
            ${path}
          </div>
        </div>
      </div>
    `;
  } else {
    // Content page
    htmlContent = `
      <div style="
        display: flex;
        width: 1200px;
        height: 628px;
        background: ${COLORS.background};
        border: 2px solid ${COLORS.accent};
        padding: 60px;
        box-sizing: border-box;
      ">
        <div style="
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          justify-content: space-between;
          font-family: 'New York', serif;
        ">
          <div style="
            font-size: 42px;
            color: ${COLORS.foreground};
            opacity: 0.8;
          ">
            @iammatthias
          </div>
          <div style="
            display: flex;
            flex-direction: column;
            gap: 16px;
          ">
            <div style="
              font-size: 28px;
              color: ${COLORS.accent};
              text-transform: capitalize;
            ">
              ${path}
            </div>
            <div style="
              font-size: 64px;
              color: ${COLORS.foreground};
            ">
              ${title}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render HTML to PNG
  const pngBuffer = await renderToPng(htmlContent, {
    width: 1200,
    height: 628,
    fonts: [
      {
        name: "New York",
        data: NewYorkFont,
        style: "normal",
        weight: 400,
      },
    ],
  });

  return new Response(pngBuffer as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
