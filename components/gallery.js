/** @jsxImportSource theme-ui */

// gallery

import Image from 'next/image'
import { useQuery, gql } from '@apollo/client'
import Snuggle from 'react-snuggle'
import { Box, AspectRatio } from 'theme-ui'
import { useRouter } from 'next/router'
import Loading from './loading'
import Squiggle from './squiggle'

// lightbox
import SimpleReactLightbox, { SRLWrapper } from 'simple-react-lightbox'

const QUERY = gql`
  query ($title: String) {
    galleryCollection(where: { title: $title }) {
      items {
        title
        imagesCollection {
          items {
            url(transform: { width: 900, quality: 60 })
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

  const imageSetTitle = data.galleryCollection.items[0].title
  const imageSetImages = data.galleryCollection.items[0].imagesCollection.items

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
      global.analytics.track('Image Viewed', {
        src: object.slides.current.source,
        location: pathname,
        direction: object.action,
        event: 'Lightbox Slide Changed',
      })
    }

    return object
  }

  function handleLightboxOpen(object) {
    if (typeof window !== 'undefined') {
      global.analytics.track('Image Viewed', {
        src: object.currentSlide.source,
        location: pathname,
        event: 'Lightbox Opened',
      })
    }

    return object
  }

  function handleLightboxClose(object) {
    if (typeof window !== 'undefined') {
      global.analytics.track('Image Viewed', {
        src: object.currentSlide.source,
        location: pathname,
        event: 'Lightbox Closed',
      })
    }

    return object
  }

  const columnWidth =
    imageSetImages.length == 1
      ? ''
      : imageSetImages.length == 2
      ? '350'
      : imageSetImages.length == 3
      ? '250'
      : '250'

  return (
    <SimpleReactLightbox>
      <SRLWrapper options={options} callbacks={callbacks}>
        <Box sx={{ mx: 'auto' }}>
          {imageSetImages.length > 1 ? (
            <Box sx={{ width: 'fit-content', margin: '0 auto' }}>
              <h2>{imageSetTitle}</h2>
              <br />
              <Squiggle />
              <br />
            </Box>
          ) : (
            ''
          )}
          <Snuggle columnWidth={columnWidth}>
            {imageSetImages.map(image => (
              <AspectRatio key={image} ratio={eval(props.ratio)}>
                <Image
                  src={image.url}
                  alt={image.title}
                  width={image.width}
                  height={image.height}
                  layout="fill"
                  placeholder="blur"
                  blurDataURL={image.loader}
                  objectFit="cover"
                />
              </AspectRatio>
            ))}
          </Snuggle>
          {imageSetImages.length > 1 ? (
            <>
              <br />
              <Squiggle strokeColor="elevated" />
              <br />
              <br />
            </>
          ) : (
            ''
          )}
        </Box>
      </SRLWrapper>
    </SimpleReactLightbox>
  )
}
