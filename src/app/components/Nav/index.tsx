// components/Nav.tsx
import React from "react";
import Link from "next/link";
import styles from "./Nav.module.scss";
import navigation from "@/app/data/navigation.json";
import ConnectButton from "./ConnectButton";

type NavLink = {
  href: string;
  label: string;
};

export type NavItem = {
  type: "link" | "dropdown" | string; // Allow a general string type
  label: string;
  href?: string;
  items?: {
    label: string;
    href: string;
  }[];
};

export default function Nav({ inverted = false }: { inverted?: boolean }) {
  return (
    <nav className={`${styles.nav}`}>
      <ul className={styles.navList}>
        {navigation.links.map((item: NavItem, index: number) => {
          // Add types for item and index
          if (item.type === "link") {
            return (
              <li key={index} className={styles.navItem}>
                <Link
                  href={item.href!}
                  passHref
                  className={`${styles.navLink} ${
                    inverted ? styles.inverted : ""
                  }`}>
                  {item.label}
                </Link>
              </li>
            );
          } else {
            return (
              <li
                key={index}
                className={`${styles.navItem} ${styles.dropdown}`}>
                <span
                  className={`${styles.navLink} ${
                    inverted && styles.inverted
                  }`}>
                  {item.label}
                </span>
                <ul className={styles.dropdownMenu}>
                  {item.items!.map(
                    (
                      subItem: NavLink,
                      subIndex: number // Add types for subItem and subIndex
                    ) => (
                      <li key={subIndex} className={styles.dropdownItem}>
                        <Link
                          href={subItem.href}
                          passHref
                          className={styles.dropdownLink}>
                          {subItem.label}
                        </Link>
                      </li>
                    )
                  )}
                  <li className={styles.dropdownItem}>
                    <ConnectButton />
                  </li>
                </ul>
              </li>
            );
          }
        })}
      </ul>
    </nav>
  );
}
