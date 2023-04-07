import Bookmarks from "@/ui/pages/bookmarks";
import { Suspense } from "react";

export default async function Index() {
  return (
    <>
      <h1>Bookmarks</h1>
      <p>
        Public bookmarks built on the Farcaster protocol and the ghost of @perl.
      </p>
      <Suspense>
        {/* @ts-expect-error */}
        <Bookmarks />
      </Suspense>
    </>
  );
}
