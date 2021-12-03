/** @jsxImportSource theme-ui */

// gallery

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useQuery, gql } from '@apollo/client'
import { Box } from 'theme-ui'
import { useRouter } from 'next/router'
import { Grid } from 'mauerwerk'
import useMeasure from 'react-use-measure'
import Loading from './loading'
import Squiggle from './squiggle'

// lightbox
import SimpleReactLightbox, {
  SRLWrapper,
  useLightbox,
} from 'simple-react-lightbox'

const QUERY = gql`
  query ($title: String) {
    galleryCollection(where: { title: $title }) {
      items {
        title
        imagesCollection {
          items {
            url(transform: { width: 1200, quality: 70 })
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
  // get path for events
  const router = useRouter()
  const pathname = router.asPath

  // container width
  const [ref, bounds] = useMeasure()

  // init lightbox
  const { openLightbox } = useLightbox()

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
  const imageSetImages = data.galleryCollection.items[0].imagesCollection.items

  // lightbox options
  const options = {
    settings: {
      overlayColor: 'rgba(0, 0, 0, 0.9)',
      autoplaySpeed: 0,
      hideControlsAfter: false,
      disablePanzoom: true,
    },
    buttons: {
      backgroundColor: 'white',
      iconColor: 'black',
      showDownloadButton: false,
    },
    caption: {
      showCaption: false,
    },
    thumbnails: {
      showThumbnails: false,
    },
  }

  const callbacks = {
    onSlideChange: object => handleSlideChange(object),
    onLightboxOpened: object => handleLightboxOpen(object),
    onLightboxClosed: object => handleLightboxClose(object),
  }

  function handleSlideChange(object) {
    if (typeof window !== 'undefined') {
      global.analytics.track('Lightbox Slide Changed', {
        src: object.slides.current.source,
        location: pathname,
        direction: object.action,
      })
    }

    return object
  }

  function handleLightboxOpen(object) {
    if (typeof window !== 'undefined') {
      global.analytics.track('Lightbox Opened', {
        src: object.currentSlide.source,
        location: pathname,
      })
    }

    return object
  }

  function handleLightboxClose(object) {
    if (typeof window !== 'undefined') {
      global.analytics.track('Lightbox Closed', {
        src: object.currentSlide.source,
        location: pathname,
      })
    }

    return object
  }

  const length = imageSetImages.length <= 5 ? imageSetImages.length : 5

  const columns =
    length > 1
      ? bounds.width >= 1000
        ? length === 5
          ? 5
          : length
        : bounds.width >= 800
        ? length === 4
          ? length
          : 4
        : bounds.width >= 600
        ? length === 3
          ? length
          : 3
        : bounds.width >= 500
        ? length === 2
          ? length
          : 2
        : 1
      : 1

  return (
    <Box ref={ref}>
      <SimpleReactLightbox>
        <SRLWrapper options={options} callbacks={callbacks}>
          <Grid
            className="grid"
            // Arbitrary data, should contain keys, possibly heights, etc.
            data={imageSetImages}
            // Key accessor, instructs grid on how to fet individual keys from the data set
            keys={d => d.title}
            // Can be a fixed value or an individual data accessor
            heights={d => {
              const aspect = props.ratio
                ? eval(props.ratio) * bounds.width
                : ((d.height / d.width) * bounds.width) / columns
              return aspect
            }}
            columns={columns}
            margin={16}
          >
            {data => (
              <Image
                src={data.url}
                alt={data.title}
                layout="fill"
                placeholder="blur"
                blurDataURL={data.loader}
                objectFit="cover"
                onClick={() => openLightbox(data.index)}
                className="gallery"
              />
            )}
          </Grid>
        </SRLWrapper>
      </SimpleReactLightbox>
    </Box>
  )
}
