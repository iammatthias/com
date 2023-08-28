"use client";
import { Masonry } from "react-plock";
import styles from "./styles.module.css";

export default function MasonryComponent({ items }: { items: string[] }) {
  const max5 = items.length > 5 ? 5 : items.length;
  const max3 = items.length > 3 ? 3 : items.length;
  return (
    <div className={styles.masonry__wrapper}>
      <Masonry
        items={items}
        config={{
          columns: [1, max3, max5],
          gap: [8, 8, 16],
          media: [640, 768, 1024],
        }}
        render={(item) => item}
      />
    </div>
  );
}
