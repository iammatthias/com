"use client";
import { Masonry } from "react-plock";
import styles from "./styles.module.css";

export default function MasonryComponent({ items, fullWidth }: { items: React.ReactNode[]; fullWidth?: boolean }) {
  const max5 = items.length > 5 ? 5 : items.length;
  const max3 = items.length > 3 ? 3 : items.length;
  return (
    <div className={fullWidth ? styles.masonry__wrapper : ""}>
      <Masonry
        items={items}
        config={{
          columns: [1, max3, fullWidth ? max5 : max3],
          gap: [8, 16, 24],
          media: [640, 768, 189.33],
        }}
        render={(item) => item}
      />
    </div>
  );
}
