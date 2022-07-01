// GalleryContentful
// Language: typescript

// Renders images in a grid, sourced from Contentful using GraphQL.

import { gql, useQuery } from '@apollo/client';
import Image from 'next/image';
import { useRouter } from 'next/router';

import Box from '@/components/Box';
import Text from '@/components/Text';
import { contentfulClient } from '@/utils/apolloProvider';

import GalleryWrapper from './GalleryWrapper';

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
            contentType
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
    client: contentfulClient,
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
    return `${src}?w=${width || 1200}&q=${quality || 60}`;
  }

  return (
    <>
      {!props.hideTitle && pathname.includes(`/work/`) ? (
        <Text as="h3" kind="h3">
          {imageSetTitle}
        </Text>
      ) : null}
      <Box className={props.className}>
        <GalleryWrapper>
          {imageSetImages.map((image: any, index: any) => (
            <Image
              key={index}
              src={image.url}
              alt={image.title}
              layout="responsive"
              height={
                image.contentType === `image/svg+xml` ? 100 : image.height
              }
              width={image.contentType === `image/svg+xml` ? 100 : image.width}
              placeholder="blur"
              blurDataURL={contentfulLoader({
                src: image.url,
                width: 5,
                quality: 1,
              })}
              objectFit="cover"
              loader={contentfulLoader}
            />
          ))}
        </GalleryWrapper>
      </Box>
    </>
  );
}
