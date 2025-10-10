import satori from "satori";
import { html } from "satori-html";
import { Resvg } from "@cf-wasm/resvg";

/**
 * Renders HTML to PNG using @cf-wasm/resvg (works in both Node.js and Cloudflare Workers)
 */
export async function renderToPng(
  htmlContent: string,
  options: {
    width: number;
    height: number;
    fonts: Array<{
      name: string;
      data: ArrayBuffer | Uint8Array;
      style: string;
      weight: number;
    }>;
  }
): Promise<Uint8Array> {
  // Generate SVG with satori
  const svg = await satori(html(htmlContent), options);

  // Convert SVG to PNG using @cf-wasm/resvg
  const resvg = new Resvg(svg);
  const pngData = resvg.render();
  return pngData.asPng();
}
