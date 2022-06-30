// gallery

import Image, { ImageLoaderProps } from 'next/image';
import useSWR from 'swr';

import GalleryWrapper from '@/components/Gallery/GalleryWrapper';

export default function Glass() {
  // data
  const fetcher = (url: any) => fetch(url).then((res) => res.json());
  const { data, error } = useSWR(`/api/glass`, fetcher);

  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;

  // data result - images
  const glassPosts = data.data;

  function glassLoader({ src }: ImageLoaderProps): string {
    return `${src}`;
  }

  console.log(glassPosts.length);

  return (
    <GalleryWrapper>
      {glassPosts.map((post: any, index: any) => (
        <a
          href={post.share_url}
          key={index}
          target="_blank"
          rel="noreferrer"
          className="umami--click--Glass-Gallery-Clicked"
        >
          <Image
            src={post.image828x0}
            alt={post.id}
            layout="responsive"
            width={post.width}
            height={post.height}
            placeholder="blur"
            blurDataURL={post.image0x240}
            objectFit="cover"
            className="gallery"
            loader={glassLoader}
            unoptimized={true}
          />
        </a>
      ))}
    </GalleryWrapper>
  );
}
