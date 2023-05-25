import Bookmarks from "@/app/components/bookmarks";

export const revalidate = 60; // revalidate this page every 60 seconds

export default async function BookmarksPage() {
  return (
    <>
      {/* Intro */}
      <h1>≋</h1>
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
