// gallery

import Image from 'next/image';
import { useQuery, gql } from '@apollo/client';
import client from '@/lib/apolloClient';
import { Box } from '@/components/primitives/box';
import { useRouter } from 'next/router';
import GalleryGrid from './galleryGrid';

// lightbox
import GalleryModal from './galleryModal';

const QUERY = gql`
  query ($title: String) {
    galleryCollection(where: { title: $title }) {
      items {
        title
        imagesCollection {
          items {
            url
            title
            height
            width
          }
        }
      }
    }
  }
`;

export default function GalleryContentful(props: any) {
  const router = useRouter();
  const pathname = router.asPath;

  // data
  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      title: props.imageset,
    },
    client,
  });

  if (loading) {
    return <p>loading...</p>;
  }

  if (error) {
    console.error(error);
    return null;
  }

  // data result - images
  const imageSetTitle = data.galleryCollection.items[0].title;
  const imageSetImages = data.galleryCollection.items[0].imagesCollection.items;

  function contentfulLoader({ src, width, quality }: any) {
    return `${src}?w=${width || 1200}&q=${quality || 70}`;
  }

  return (
    <>
      {!props.hideTitle && pathname.includes(`/work/`) ? (
        <h3>{imageSetTitle}</h3>
      ) : null}
      <Box className={props.className}>
        <GalleryGrid>
          {imageSetImages.map((image: any, index: any) => (
            <GalleryModal key={index} imageKey={index} images={imageSetImages}>
              <Image
                src={image.url}
                alt={image.title}
                layout="responsive"
                height={image.height}
                width={image.width}
                placeholder="blur"
                blurDataURL={contentfulLoader({
                  src: image.url,
                  width: 5,
                  quality: 1,
                })}
                objectFit="cover"
                loader={contentfulLoader}
              />
            </GalleryModal>
          ))}
        </GalleryGrid>
      </Box>
    </>
  );
}
