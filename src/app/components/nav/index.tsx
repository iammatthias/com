"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import styles from "./styles.module.css";
import MoonSunMoon from "../moon_sun_moon";
import Link from "next/link";

export default function Nav() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className={styles.iconButton}>
          <Link href='/'>
            <MoonSunMoon />
          </Link>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.dropdownMenuContent} sideOffset={8}>
          <DropdownMenu.Item className={styles.dropdownMenuItem}>
            <Link href='/'>/</Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item className={styles.dropdownMenuItem}>
            <Link href='https://iammatthias.com'>.COM</Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item className={styles.dropdownMenuItem}>
            <Link href='https://iammatthias.xyz'>.XYZ</Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item className={styles.dropdownMenuItem}>
            <Link href='https://iammatthias.art'>.ART</Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
