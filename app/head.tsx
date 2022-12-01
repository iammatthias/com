import Script from 'next/script';

export default function Head() {
  return (
    <>
      <title>I AM MATTHIAS</title>
      <meta name="description" content="A digital garden" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
