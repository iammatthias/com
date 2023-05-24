"use client";
import { Masonry } from "react-plock";
import RemoteImage from "./remoteImage";

export default function MasonryComponent({ items }: { items: string[] }) {
  return (
    <Masonry
      items={items}
      config={{
        columns: [1, 3, 5],
        gap: [8, 16, 32],
        media: [640, 768, 1024],
      }}
      render={(item, idx) => (
        // <img
        //   key={idx}
        //   src={item as string}
        //   style={{ width: "100%", height: "auto" }}
        // />
        // <RemoteImage key={idx} src={item as string} />
        <>{item}</>
      )}
    />
  );
}
