// components/Cell.tsx
import React from "react";
import styles from "./Grid.module.scss";
import { ReactElement } from "react";
import Token from "@/app/components/Token";

export interface SubGridProps {
  title?: string;
  id?: string;
  created?: string;
  isLongform?: boolean | unknown;
  isToken?: boolean | unknown;
  tokenType?: string;
  contentUrl?: string;
  contentUrlMimeType?: string;
  source?: string;
  description?: string;
  content?: ReactElement;
}

export default function SubGrid({
  title = "",
  id = "",
  created = "",
  isLongform = false,
  isToken = false,
  tokenType = "",
  contentUrl = "",
  contentUrlMimeType = "",
  source = "",
  description = "",
  content = <></>,
}: SubGridProps) {
  function Content() {
    if (isLongform) {
      return <h2 className={`${styles.title} ${styles.borderTop}`}>{title}</h2>;
    }

    if (isToken) {
      const tokenData = {
        tokenType,
        name: title,
        description,
        contentUrl,
        contentUrlMimeType,
      };

      return <Token tokenData={tokenData} showCaption={false} />;
    }

    return content;
  }

  return (
    <div className={`${styles.subGrid}`} key={id}>
      <small className={`${styles.source}`}>{source}</small>
      <small className={`${styles.created}`}>
        {new Date(Number(created)).toLocaleDateString()}
      </small>
      <div className={`${styles.content}`}>
        <Content />
      </div>
    </div>
  );
}
