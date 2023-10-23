import Link from "next/link";
import MoonSunMoon from "../../components/moon_sun_moon";
import styles from "./page.module.css";
import BookmarkList from "../../components/bookmark_list";

export default function Bookmarks() {
  return (
    <section className={styles.section}>
      <Link href='/'>
        <MoonSunMoon />
      </Link>
      <h1>Bookmarks</h1>
      <p>
        A collection of content shared in the{" "}
        <Link href='https://www.farcaster.xyz/' title='Farcaster'>
          Farcaster
        </Link>{" "}
        ecosystem that I found interesting.
      </p>
      <p>Any posts tagged with ≋ from my account will be mirrored here.</p>
      <BookmarkList />
    </section>
  );
}
