import Bookmarks from "@/app/components/bookmarks";

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
        protocol <a href='https://www.farcaster.xyz//'>Farcaster</a>.
      </p>
      <hr />

      {/* @ts-expect-error */}
      <Bookmarks />
    </>
  );
}
