/** @jsxImportSource theme-ui */

// gallery

import Image from 'next/image'
import { useRef } from 'react'
import { useQuery, gql } from '@apollo/client'
import { Box } from 'theme-ui'
import {
  Masonry,
  useMasonry,
  usePositioner,
  useContainerPosition,
  useScroller,
} from 'masonic'
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
  // container width
  const [ref, bounds] = useMeasure()

  // data
  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      title: props.imageset,
    },
  })

  if (loading) {
    return (
      <Box sx={{ width: 'fit-content', margin: '0 auto' }}>
        <Loading />
        <Squiggle />
      </Box>
    )
  }

  if (error) {
    console.error(error)
    return null
  }

  // data result - images
  const imageSetTitle = data.galleryCollection.items[0].title
  const imageSetImages = data.galleryCollection.items[0].imagesCollection.items
  const length = imageSetImages.length <= 7 ? imageSetImages.length : 7
  const columns = bounds.width / length
  console.log(columns)

  // masonry

  const MasonryCard = ({ index, data }) => (
    <div
      key={index}
      sx={{
        height: props.ratio
          ? eval(props.ratio) * columns
          : (data.height / data.width) * columns,
        '*': {
          borderRadius: (length = 1 ? '4px' : 0),
          boxShadow: (length = 1 ? 'card' : ''),
        },
      }}
      className="workDamnYou"
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
  )

  return (
    <Box ref={ref}>
      <h1>{imageSetTitle}</h1>
      <Lightbox>
        <Masonry
          items={imageSetImages}
          render={MasonryCard}
          columnGutter={8}
          columnWidth={columns}
          overscanBy={Infinity}
        />
      </Lightbox>
    </Box>
  )
}
