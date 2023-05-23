import Link from "next/link";
import NotionPosts from "./components/notionPosts";
import styles from "./page.module.scss";

export const revalidate = 60; // revalidate this page every 60 seconds

export type LinkItemProps = {
  href: string;
  name: string;
  handle: string;
};

const LinkItem = ({ href, name, handle }: LinkItemProps) => (
  <Link href={href} className={styles.section__links__item} target='_blank'>
    <p className={styles.hideOnHover}>{name}</p>

    <p className={styles.showOnHover}>{handle}</p>
  </Link>
);

export default async function Home() {
  return (
    <>
      {/* Intro */}
      <h1>Hi, I am Matthias</h1>
      <p>
        I am a photographer & marketing technologist. I architect & build growth
        operations for audacious teams. Through the years I have worked with
        wonderful groups like{" "}
        <span className={`highlight`}>Revance (Opul)</span>,{" "}
        <span className={`highlight`}>Tornado</span>,{" "}
        <span className={`highlight`}>Aspiration</span>,{" "}
        <span className={`highlight`}>Surf Air</span>, and{" "}
        <span className={`highlight`}>General Assembly</span>.
      </p>
      <hr />
      {/* External Links */}
      <h2>Online & Onchain</h2>
      <nav className={styles.section__links}>
        <LinkItem
          href='https://warpcast.com/iammatthias'
          name='farcaster'
          handle='@iammatthias'
        />
        <LinkItem
          href='https://staging.bsky.app/profile/iam.bsky.social'
          name='bluesky'
          handle='@iam.bsky.social'
        />
        <LinkItem href='https://read.cv/iam' name='read.cv' handle='@iam' />
        {/* https://gallery.so/iam */}
        <LinkItem
          href='https://gallery.so/iam'
          name='gallery.so'
          handle='@iam'
        />
        <LinkItem
          href='https://theguestbook.xyz/'
          name='the guestbook'
          handle='the guestbook'
        />
        {/* <div className={`${styles.section__links__item} disabled`}>
          attn token
        </div> */}
      </nav>
      <hr />
      {/* Content */}

      {/* @ts-expect-error */}
      <NotionPosts />
    </>
  );
}
