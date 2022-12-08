import getArweaveEntries from '@/data/arweave/getArweaveEntries';
import getObsidianEntries from '@/data/obsidian/getObsidianEntries';
import Script from 'next/script';

async function getData() {
  const arweaveEntries = await getArweaveEntries();
  const obsidianEntries = await getObsidianEntries();

  const entries = await Promise.all([...arweaveEntries, ...obsidianEntries]);

  const sortedEntries = entries.sort((a: any, b: any) => {
    return b.timestamp - a.timestamp;
  });

  return {
    sortedEntries,
  };
}

async function getPage(slug: any) {
  const data = await getData();

  const page = data.sortedEntries.find((post: any) => post.slug === slug);

  return page;
}

export default async function Head({ params }: any) {
  console.log(`params`, params);

  const ogImgBaseURL = `https://portfolio.iammatthias.com/api/og`;

  if (params?.slug) {
    const page = await getPage(params.slug);
    console.log(`page`, page);
    // ogImgBaseURL = `https://portfolio.iammatthias.com/api/og?title=${page.title}&description=${page.description}`;
  }

  return (
    <>
      <title>I AM MATTHIAS</title>
      <meta name="description" content="A digital garden" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:image" content={ogImgBaseURL} />
      <link rel="icon" href="/favicon.ico" />
      <Script
        async
        defer
        data-website-id="e4c8b068-8ea2-4efc-9553-18d0fbfb7521"
        src="https://a.iammatthias.com/umami.js"
      />
    </>
  );
}
