"use client";
import { Masonry } from "react-plock";
import styles from "./styles.module.css";

export default function MasonryComponent({ items }: { items: string[] }) {
  // const maxColumns = items.length > 5 ? 5 : items.length;
  return (
    <div className={styles.masonry__wrapper}>
      <Masonry
        items={items}
        config={{
          columns: [1, 3, 5],
          gap: [8, 8, 16],
          media: [640, 768, 1024],
        }}
        render={(item) => item}
      />
    </div>
  );
}
