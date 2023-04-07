"use client";

// import { ConnectKitButton } from "connectkit";

import styles from "./nav.module.scss";
import Zorb from "./zorb";

import Link from "next/link";

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.navItemWrapper}>
        <Link href='/'>
          <h1>I am Matthias</h1>
          <small>Photographer & Growth Technologist</small>
        </Link>
        {/* <ul>
          <li>
            <ConnectKitButton />
            <ConnectKitButton.Custom>
              {({
                isConnected,
                isConnecting,
                show,
                hide,
                address,
                ensName,
                chain,
              }) => {
                return <Zorb onClick={show} />;
              }}
            </ConnectKitButton.Custom>
          </li>
        </ul> */}
      </div>
      <div className={styles.navItemWrapper}>
        <h1>Content</h1>
        <small>Articles & Art</small>
        <ul>
          <li>
            <Link href='/posts'>
              <h5>Posts</h5>
              <small>A mix of longform and shortform content</small>
            </Link>
          </li>
          <li>
            <Link href='/art'>
              <h5>Art</h5>
              <small>A curated collection of personal artwork</small>
            </Link>
          </li>
          <li>
            <Link href='/bookmarks'>
              <h5>Bookmarks</h5>
              <small>Public bookmarks built on the Farcaster protocol</small>
            </Link>
          </li>
        </ul>
      </div>
      <div className={styles.navItemWrapper}>
        <h1>Channels</h1>
        <small>On the World Wide Web</small>

        <ul>
          <li>
            <Link href='https://warpcast.com/iammatthias' target='_blank'>
              <h5>Warpcaster</h5>
              <small>A Farcaster client</small>
            </Link>
          </li>
          <li>
            <Link href='https://glass.photo/iammatthias' target='_blank'>
              <h5>Glass</h5>
              <small>Quick phone edits of SLR shots</small>
            </Link>
          </li>
          <li>
            <Link href='https://twitter.com/iammatthias' target='_blank'>
              <h5>Twitter</h5>
              <small>Bird app</small>
            </Link>
          </li>
          <li>
            <Link href='https://iam.read.cv' target='_blank'>
              <h5>Read.cv</h5>
              <small>Resume</small>
            </Link>
          </li>
        </ul>
      </div>
      {/* <div className={styles.navItemWrapper}>
        <Zorb />
      </div> */}
    </nav>
  );
}
