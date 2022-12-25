import Script from 'next/script';

export default function Head() {
  const ogImgBaseURL = `https://iammatthias.com/api/og`;

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
        data-website-id="ce0e2219-dc16-47e7-9211-19554e397773"
        src="https://a.iammatthias.com/umami.js"
      />
    </>
  );
}
