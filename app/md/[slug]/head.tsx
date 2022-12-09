import getObsidianEntry from '@/data/obsidian/getObsidianEntry';

import Script from 'next/script';

async function getData(slug: string) {
  const entry = await getObsidianEntry(slug);

  return {
    ...entry,
  };
}

export default async function Head({ params }: any) {
  let title = `I AM MATTHIAS`;
  let ogImgBaseURL = `https://portfolio.iammatthias.com/api/og`;

  if (params?.slug) {
    const data = await getData(params.slug);
    title =
      data.title == data.timestamp
        ? new Date(data.timestamp).toLocaleDateString(`en-US`)
        : data.title;
    ogImgBaseURL = `https://portfolio.iammatthias.com/api/og?title=${encodeURI(title)}`;
  }

  return (
    <>
      <title>{`IAM — ${title}`}</title>
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
