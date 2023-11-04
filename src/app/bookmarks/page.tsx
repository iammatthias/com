import Link from "next/link";

import BookmarkList from "../../components/bookmark_list";

export const revalidate = 60;

export default async function Bookmarks() {
  await fetch(`https://iammatthias.com/api/bookmarks`);
  return (
    <section>
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
