"use client";

import { useRouter } from "next/navigation";
import styles from "./button.module.scss";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      className={`${styles.button}`}
      type='button'
      onClick={() => router.back()}>
      ⇜ Back
    </button>
  );
}
