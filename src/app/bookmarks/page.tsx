import Bookmarks from "@/app/components/bookmarks";
import Link from "next/link";

// revalidate every 20 min
export const revalidate = 1200;

export const metadata = {
  openGraph: {
    locale: "en_US",
    url: "https://iammatthias.com",
    title: "IAM ☾ ☼ ☽ Bookmarks",
    description: "Bookmarks collected on Farcaster",
    images: [
      {
        url: "api/og?title=Bookmarks",
        width: 1200,
        height: 630,
        alt: "iammatthias.com/bookmarks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IAM ☾ ☼ ☽ Bookmarks",
    description: "Bookmarks collected on Farcaster",
    creator: "@iammatthias",
    images: [
      {
        url: "api/og?title=Bookmarks",
        width: 1200,
        height: 630,
        alt: "iammatthias.com/bookmarks",
      },
    ],
  },
};

export default async function BookmarksPage() {
  return (
    <>
      <p>
        When I reply to a cast with `≋`, it gets archived and displayed here.
      </p>
      <p>
        This happens permisionlessly on the sufficiently decentralized social
        protocol <Link href='https://www.farcaster.xyz//'>Farcaster</Link>.
      </p>
      <hr />

      {/* @ts-expect-error */}
      <Bookmarks />
    </>
  );
}
