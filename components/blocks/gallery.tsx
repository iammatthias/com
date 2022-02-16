// gallery

import Image, { ImageLoaderProps } from 'next/image'
import { useQuery, gql } from '@apollo/client'
import Box from '../primitives/box'
import Masonry from 'react-masonry-css'
import { useRouter } from 'next/router'
import useMeasure from 'react-use-measure'

// lightbox
import Lightbox from './galleryLightbox'

const QUERY = gql`
  query ($title: String) {
    galleryCollection(where: { title: $title }) {
      items {
        title
        imagesCollection {
          items {
            url
            title
          }
        }
      }
    }
  }
`

export default function Gallery(props: any) {
  const router = useRouter()
  const pathname = router.asPath

  // container width
  // @ts-ignore
  const [ref, bounds] = useMeasure({ options: { offset: false } })

  // data
  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      title: props.imageset,
    },
  })

  if (loading) {
    return <>loading...</>
  }

  if (error) {
    console.error(error)
    return null
  }

  // data result - images
  const imageSetTitle = data.galleryCollection.items[0].title
  const imageSetImages = data.galleryCollection.items[0].imagesCollection.items
  const imageSetLength = imageSetImages.length
  const columnLimit =
    bounds.width > 1536
      ? 7
      : bounds.width > 1024
      ? 5
      : bounds.width > 768
      ? 3
      : bounds.width > 512
      ? 2
      : 2
  const columnWidth =
    bounds.width /
    (imageSetLength >= columnLimit ? columnLimit : imageSetLength)
  const columns = imageSetLength >= columnLimit ? columnLimit : imageSetLength

  function contentfulLoader({ src, quality, width }: ImageLoaderProps): string {
    return `${src}?w=${width || 1200}&q=${quality || 70}`
  }

  return (
    <Box ref={ref} className="gallery" css={{ marginBottom: '2rem' }}>
      {pathname.includes('/work/') ? <h2>{imageSetTitle}</h2> : null}

      <Lightbox className="container galleryGrid">
        <Masonry
          breakpointCols={columns}
          className="my-masonry-grid"
          columnClassName="column"
        >
          {imageSetImages.map((image: any, index: any) => (
            <Box
              className="column"
              key={index}
              css={{
                position: 'relative',
                width: '100%',
                marginBottom: '24px',
                height: props.ratio
                  ? eval(props.ratio) * columnWidth
                  : (image.height / image.width) * columnWidth,
              }}
            >
              <a href={image.url}>
                <Image
                  src={image.url}
                  alt={image.title}
                  layout="fill"
                  placeholder="blur"
                  blurDataURL={contentfulLoader({
                    src: image.url,
                    width: 5,
                    quality: 1,
                  })}
                  objectFit="cover"
                  className="gallery"
                  loader={contentfulLoader}
                />
              </a>
            </Box>
          ))}
        </Masonry>
      </Lightbox>
    </Box>
  )
}
