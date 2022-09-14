// GalleryGlass
// Language: typescript

// Renders images in a grid, sourced from my public profile on Glass: https://glass.photo/iammatthias

import Image, { ImageLoaderProps } from 'next/image';
import useSWR from 'swr';

import Wrapper from '@/components/gallery/wrapper';

export default function Glass() {
  // data
  const fetcher = (url: any) => fetch(url).then((res) => res.json());
  const { data, error } = useSWR(`/api/glass`, fetcher);

  if (error) return null;
  if (!data) return null;

  // data result - images
  const glassPosts = data.data;

  function glassLoader({ src }: ImageLoaderProps): string {
    return `${src}`;
  }

  console.log(glassPosts.length);

  return (
    <Wrapper>
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
    </Wrapper>
  );
}
