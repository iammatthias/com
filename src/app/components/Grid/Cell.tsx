// components/Cell.tsx
import React from "react";
import styles from "./Grid.module.scss";

export interface CellProps {
  children: React.ReactNode;
  span?: number;
  doubleHeight?: boolean;
  center?: boolean;
  border?: boolean;
  invert?: boolean;
  invisible?: boolean;
}

export default function Cell({
  children,
  span = 2,
  doubleHeight = false,
  center = false,
  border = false,
  invert = false,
  invisible = false,
  ...props
}: CellProps) {
  const classNames = [styles.cell];

  if (span >= 1 && span <= 10) {
    classNames.push(styles[`span${span}`]);
  }

  if (doubleHeight) {
    classNames.push(styles.doubleHeight);
  }

  if (center) {
    classNames.push(styles.center);
  }

  if (border) {
    classNames.push(styles.border);
  }

  if (invert) {
    classNames.push(styles.invert);
  }

  if (invisible) {
    classNames.push(styles.invisible);
  }

  return (
    <div className={classNames.join(" ")} {...props}>
      {children}
    </div>
  );
}
