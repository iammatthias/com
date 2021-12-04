/** @jsxImportSource theme-ui */

// gallery

import Image from 'next/image'
import { useQuery, gql } from '@apollo/client'
import { Box } from 'theme-ui'
import { Masonry } from 'masonic'
import { useRouter } from 'next/router'
import useMeasure from 'react-use-measure'
import Loading from './loading'
import Squiggle from './squiggle'

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
            urlSmall: url(transform: { width: 500, quality: 85 })
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
  const columns = bounds.width / (imageSetLength >= 6 ? 6 : imageSetLength)

  // masonry

  const MasonryCard = ({ index, data, width }) => (
    <>
      {/* <p>{(data.height / data.width) * columns}</p> */}
      <div
        key={index}
        sx={{
          position: 'relative',
          width: '100%',
          height: props.ratio
            ? eval(props.ratio) * columns
            : (data.height / data.width) * columns,
          '*': {
            borderRadius: '4px',
            boxShadow: 'card',
          },
        }}
      >
        <Image
          src={(length = 1 ? data.url : data.urlSmall)}
          alt={data.title}
          layout="fill"
          placeholder="blur"
          blurDataURL={data.loader}
          objectFit="cover"
          className="gallery"
        />
      </div>
    </>
  )

  return (
    <Box ref={ref}>
      {pathname.includes('/work/') ? <h1>{imageSetTitle}</h1> : null}

      <Lightbox>
        <Masonry
          items={imageSetImages}
          render={MasonryCard}
          columnGutter={16}
          columnWidth={columns}
          overscanBy={Infinity}
        />
      </Lightbox>
    </Box>
  )
}
