/** @jsxImportSource theme-ui */

// gallery

import Image from 'next/image'
import { useQuery, gql } from '@apollo/client'
import { Box } from 'theme-ui'
import Masonry from 'react-masonry-css'
import { useRouter } from 'next/router'
import useMeasure from 'react-use-measure'
import Loading from './loading'

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
            loader: url(transform: { width: 5, quality: 1 })
            title
            width
            height
          }
        }
      }
    }
  }
`

export default function Gallery(props) {
  const router = useRouter()
  const pathname = router.asPath

  // container width
  const [ref, bounds] = useMeasure({ options: { offset: false } })

  // data
  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      title: props.imageset,
    },
  })

  if (loading) {
    return <Loading />
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

  // bricks

  console.log(bounds.width)

  return (
    <Box ref={ref}>
      {pathname.includes('/work/') ? <h1>{imageSetTitle}</h1> : null}

      <Lightbox className="container">
        <Masonry
          breakpointCols={columns}
          className="my-masonry-grid"
          sx={{
            display: 'flex',
            width: 'auto',
            ml: '-8px',
            '.column': {
              pl: '8px',
              mb: '8px',
              backgroundClip: 'padding-box',
            },
          }}
          columnClassName="column"
        >
          {imageSetImages.map((image, index) => (
            <div
              className="column"
              key={index}
              sx={{
                position: 'relative',
                width: '100%',
                height: props.ratio
                  ? eval(props.ratio) * columnWidth
                  : (image.height / image.width) * columnWidth,
                '*': {
                  boxShadow: 'card',
                },
              }}
            >
              <a href={image.url}>
                <Image
                  src={(length = 1 ? image.url : image.urlSmall)}
                  alt={image.title}
                  layout="fill"
                  placeholder="blur"
                  blurDataURL={image.loader}
                  objectFit="cover"
                  className="gallery"
                />
              </a>
            </div>
          ))}
        </Masonry>
      </Lightbox>
    </Box>
  )
}
