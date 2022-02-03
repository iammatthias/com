// gallery

import Image from 'next/image'
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
            url(transform: { width: 1200, quality: 75 })
            urlSmall: url(transform: { width: 400, quality: 75 })
            placeholder: url(transform: { width: 5, quality: 1 })
            title
            width
            height
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
    bounds.width > 1100
      ? 7
      : bounds.width > 900
      ? 5
      : bounds.width > 700
      ? 3
      : bounds.width > 500
      ? 2
      : 2
  const columnWidth =
    bounds.width /
    (imageSetLength >= columnLimit ? columnLimit : imageSetLength)
  const columns = imageSetLength >= columnLimit ? columnLimit : imageSetLength

  function normalizeSrc(src: string) {
    return src[0] === '/' ? src.slice(1) : src
  }

  function contentfulLoader({ src }: any): string {
    return `${normalizeSrc(src)}`
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
                height: props.ratio
                  ? eval(props.ratio) * columnWidth
                  : (image.height / image.width) * columnWidth,
              }}
            >
              <a href={image.url}>
                <Image
                  src={(length = 1 ? image.url : image.urlSmall)}
                  alt={image.title}
                  layout="fill"
                  placeholder="blur"
                  blurDataURL={image.placeholder}
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
