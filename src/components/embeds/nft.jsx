import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

function NFT({
  data: {
    name,
    description,
    ownerOf,
    ownerOfUrl,
    creatorOf,
    platform,
    platformUrl,
    mediaUrl,
    mediaPageUrl,
    mediaMimeType,
    timestamp,
  },
}) {
  return (
    <div
      className="shadow dark:shadow-none dark:bg-black rounded-lg max-w-lg mx-auto"
      data-nft
    >
      <section className="flex items-center justify-between py-5 px-6">
        <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold">
          {isAddress(creatorOf) ? toTrimmedAddress(creatorOf) : creatorOf}
        </span>

        <a
          className="bg-gray-100 dark:bg-gray-900 !rounded-full py-2 px-2.5 block"
          href={mediaPageUrl}
          target="_blank"
          rel="noreferrer"
        >
          <svg
            viewBox="0 0 177 68"
            fill="currentColor"
            className="w-6 text-gray-500 dark:text-gray-600"
          >
            <path
              d="M17.405 64.127l5.324-24.978c1.127-5.098 2.15-11.419 2.56-15.802.819 3.058 2.662 8.767 4.3 13.05l10.75 28.24c1.024 2.548 1.331 2.956 2.355 3.262.41.081.492.098 1.556.101h11.606c3.232-.02 3.365-.3 4.141-3.873L72.693 4.894c.205-1.02.307-1.937.307-2.345 0-.816-.307-1.326-.921-1.937C71.464.102 71.157 0 68.597 0h-8.19c-3.89 0-3.993.102-4.812 3.874L50.68 26.813c-.921 4.588-2.355 13.05-2.764 17.637-1.024-3.568-2.867-9.073-4.403-13.05L33.07 3.365C32.046.816 31.842.408 30.715.102a16.23 16.23 0 00-.14-.028l-.126-.022c-.246-.039-.491-.049-1.29-.051L28.448 0H17.712c-3.788 0-3.89.102-4.71 3.874L.308 63.107C.102 64.127 0 65.044 0 65.452c0 .815.307 1.325.921 1.937.588.487.895.602 3.16.611h9.096c3.32-.02 3.452-.3 4.228-3.873zm65.413 0l4.812-22.328h25.35c3.233-.02 3.366-.3 4.142-3.874l1.126-5.097c.41-1.733.41-1.835.41-2.345 0-.816-.308-1.325-.922-1.937-.614-.51-.922-.612-3.482-.612H90.6l2.765-13.151h29.184c3.789 0 3.891-.102 4.71-3.772l1.331-6.117c.362-1.53.404-1.789.41-2.179v-.166c0-.816-.307-1.326-.922-1.937-.614-.51-.921-.612-3.481-.612H82.715c-3.789 0-3.891.102-4.71 3.772L65.307 63.107c-.205 1.02-.307 1.937-.307 2.345 0 .815.307 1.325.922 1.937.587.487.894.602 3.16.611h9.595c3.334-.02 3.46-.295 4.14-3.873zm61.259 0l10.564-49.344h16c3.795 0 3.897-.102 4.718-3.772l1.333-6.117c.205-1.122.308-1.836.308-2.345 0-.816-.308-1.326-.923-1.937-.615-.51-.923-.612-3.487-.612h-49.231c-3.795 0-3.897.102-4.718 3.772l-1.333 6.117c-.205 1.02-.308 1.937-.308 2.345 0 .816.308 1.325.923 1.937.615.51.923.612 3.487.612h15.385l-10.257 48.324c-.307 1.427-.41 1.835-.41 2.345 0 .815.308 1.325.923 1.937.589.487.896.602 3.166.611h9.624c3.326-.02 3.459-.3 4.236-3.873z"
              fill="currentColor"
              fillRule="nonzero"
            />
          </svg>
        </a>
      </section>

      {mediaUrl && mediaMimeType && (
        <section className="nfte__media">
          <Media media={mediaUrl} mediaMimeType={mediaMimeType} />
        </section>
      )}

      <div className="pt-3 pb-4 px-6">
        <div className="flex items-center justify-between !mb-3">
          <p className="text-gray-500 dark:text-gray-600 text-sm dark:font-medium">
            Collected by{' '}
            <a
              href={ownerOfUrl}
              className="!text-gray-500 !dark:text-gray-300 !font-medium"
            >
              {isAddress(ownerOf) ? toTrimmedAddress(ownerOf) : ownerOf}
            </a>
          </p>
          <a
            target="_blank"
            href={mediaPageUrl}
            rel="noreferrer"
            className="!text-gray-500 text-sm !font-semibold"
          >
            <span>
              {mediaPageUrl?.includes('etherscan.io') ? 'View' : 'Buy / Bid'}
            </span>{' '}
            <span className="transform -rotate-45 text-sm inline-block !font-medium">
              →
            </span>
          </a>
        </div>

        <p className="font-semibold text-gray-700 dark:text-gray-300">{name}</p>
        <p className="text-gray-500 dark:text-gray-600 block text-[0.9rem]">
          {description}
        </p>

        <div className="!mt-4">
          <span className="text-gray-300 dark:text-gray-500 text-sm !mr-4">
            {tsFormat(timestamp)}
          </span>
          <a
            target="_blank"
            href={platformUrl}
            rel="noreferrer"
            className="!text-gray-400 text-sm !font-medium mr-4"
          >
            <span>
              {isAddress(platform) ? toTrimmedAddress(platform) : platform}
            </span>{' '}
            <span className="transform -rotate-45 text-sm inline-block">→</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="shadow dark:shadow-none dark:bg-black rounded-lg max-w-lg mx-auto">
      <div className="py-16 px-8 flex items-center justify-center">
        <svg
          className="w-6 h-6 animate-spin text-black dark:text-white text-opacity-40"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="32"
            cx="12"
            cy="12"
            r="10"
          ></circle>
          <circle
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            cx="12"
            cy="12"
            r="10"
            opacity="0.25"
          ></circle>
        </svg>
      </div>
    </div>
  );
}

function TextMedia({ media }) {
  const [content, setContent] = useState(null);

  useEffect(() => {
    fetch(media)
      .then((r) => r.text())
      .then((r) => setContent(r));
  }, []);

  return <div>{content}</div>;
}

function VideoMedia({ media }) {
  const videoRef = useRef(null);
  const [isMuted, setMuted] = useState(true);

  useEffect(() => {
    videoRef.current.muted = isMuted;
  }, [isMuted]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        muted
        autoPlay={true}
        controls={false}
        loop
        playsInline
      >
        <source src={media} />
      </video>
      <button
        onClick={() => setMuted((state) => !state)}
        className="absolute bottom-2 right-2 bg-white bg-opacity-10 !rounded-full p-2 text-white text-opacity-30 hover:text-opacity-70 focus:outline-none"
        style={{ backdropFilter: 'blur(2px) brightness(1.3)' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="transition w-6 h-6"
        >
          {isMuted ? (
            <>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                clipRule="evenodd"
              ></path>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              ></path>
            </>
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            ></path>
          )}
        </svg>
      </button>
    </div>
  );
}

function AudioMedia({ media }) {
  return <audio controls src={media}></audio>;
}

function Media({ media, mediaMimeType }) {
  if (mediaMimeType?.includes('text')) return <TextMedia media={media} />;

  if (mediaMimeType?.includes('video')) return <VideoMedia media={media} />;

  if (mediaMimeType?.includes('audio')) return <AudioMedia media={media} />;

  return <img src={media} />;
}

function toTrimmedAddress(value) {
  if (!value) return '';
  return (
    value.substr(0, 6) + '…' + value.substr(value.length - 4, value.length)
  );
}

function isAddress(value) {
  return value?.startsWith('0x');
}

function tsFormat(value) {
  const dateObj = new Date(parseInt(value) * 1000);

  return `${String(dateObj.getUTCDate()).padStart(2, '0')}/${String(
    dateObj.getUTCMonth() + 1,
  ).padStart(2, '0')}/${dateObj.getUTCFullYear() - 2000}`;
}

export default function Embed({ contract, tokenId }) {
  const { data, error } = useSWR(
    () => `/api/nft-data?contract=${contract}&tokenId=${tokenId}`,
  );

  if (error)
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900 dark:bg-opacity-50 p-4">
        <div className="flex items-center justify-center">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400 dark:text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              ></path>
            </svg>
          </div>
          <div className="ml-3 flex-1 md:flex md:justify-between">
            <p className="text-sm text-red-700 dark:text-red-400">
              The NFT embed failed to load
            </p>
          </div>
        </div>
      </div>
    );

  if (!data && !error) return <Loading />;

  return <NFT data={data} />;
}
