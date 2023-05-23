import { CSSProperties } from "react";

export default function Iframe({ src }: { src: string }) {
  const domain = new URL(src).hostname;
  let style: CSSProperties;

  switch (domain) {
    case "embed.music.apple.com":
      style = {
        position: "relative",
        height: "450px",
      };
      break;
    case "open.spotify.com":
      style = {
        position: "relative",
        height: "352px",
      };
      break;
    default:
      style = {
        position: "relative",
        height: "450px", // Default height
      };
      break;
  }

  return (
    <div style={{ ...style, left: 0, width: "100%" }}>
      <iframe
        src={src}
        style={{
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          position: "absolute",
          border: 0,
        }}
        allow='clipboard-write; encrypted-media;'></iframe>
    </div>
  );
}
