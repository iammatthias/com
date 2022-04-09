// gallery

import Image, { ImageLoaderProps } from 'next/image';
import useSWR from 'swr';
import { Box } from '@/components/primitives/box';
import Masonry from 'react-masonry-css';
import useMeasure from 'react-use-measure';
import GalleryGrid from './galleryGrid';

export default function Glass(props: any) {
  // container width

  const [ref, bounds] = useMeasure({ options: { offset: false } } as any);

  // data
  const fetcher = (url: any) => fetch(url).then((res) => res.json());
  function useGlass() {
    const { data, error } = useSWR(`/api/glass`, fetcher);

    return {
      data: data,
      isLoading: !error && !data,
      isError: error,
    };
  }

  // data result - images
  const data = useGlass();
  const glassPosts = data.data ? data.data.data : [];

  function glassLoader({ src }: ImageLoaderProps): string {
    return `${src}`;
  }

  return (
    <Box ref={ref} className="gallery" css={{ marginBottom: `2rem` }}>
      <GalleryGrid>
        {glassPosts.map((post: any, index: any) => (
          <a href={post.share_url} key={index}>
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
      </GalleryGrid>
    </Box>
  );
}
