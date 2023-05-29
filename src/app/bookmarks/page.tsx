import Bookmarks from "@/app/components/bookmarks";
import Link from "next/link";

// revalidate every 20 min
export const revalidate = 1200;

export default async function BookmarksPage() {
  return (
    <>
      <p>
        When I reply to a cast with `≋`, it gets is archived and displayed here.
      </p>
      <p>
        This happens permisionlessly on the sufficiently decentralized social
        protocol <a href='https://www.farcaster.xyz//'>Farcaster</a>. New
        bookmarks are queried using{" "}
        <Link href='https://www.discove.xyz/@iammatthias/bookmarks'>
          Discove
        </Link>{" "}
        and are stored in Supabase.
      </p>

      <hr />

      {/* @ts-expect-error */}
      <Bookmarks />
    </>
  );
}
