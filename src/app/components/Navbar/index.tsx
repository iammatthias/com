// components/NavBar.tsx
import React from "react";
import Link from "next/link";
import styles from "./NavBar.module.scss";

type NavLink = {
  href: string;
  label: string;
};

type NavDropdown = {
  label: string;
  items: NavLink[];
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

interface NavBarProps {
  items: NavItem[];
}

export default function NavBar({ items }: NavBarProps) {
  return (
    <nav className={styles.nav}>
      <ul className={styles.navList}>
        {items.map((item, index) => {
          if (item.type === "link") {
            return (
              <li key={index} className={styles.navItem}>
                <Link href={item.href!} className={styles.navLink}>
                  {item.label}
                </Link>
              </li>
            );
          } else {
            return (
              <li
                key={index}
                className={`${styles.navItem} ${styles.dropdown}`}>
                <span className={styles.navLink}>{item.label}</span>
                <ul className={styles.dropdownMenu}>
                  {item.items!.map((subItem, subIndex) => (
                    <li key={subIndex} className={styles.dropdownItem}>
                      <Link href={subItem.href} className={styles.dropdownLink}>
                        {subItem.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            );
          }
        })}
      </ul>
    </nav>
  );
}
