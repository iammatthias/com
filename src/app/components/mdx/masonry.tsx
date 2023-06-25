"use client";
import { Masonry } from "react-plock";

export default function MasonryComponent({ items }: { items: string[] }) {
  const maxColumns = items.length > 5 ? 5 : items.length;
  return (
    <Masonry
      items={items}
      config={{
        columns: [1, 3, maxColumns],
        gap: [8, 16, 32],
        media: [640, 768, 1024],
      }}
      render={(item) => item}
    />
  );
}
