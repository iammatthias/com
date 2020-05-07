/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Image, Box, Link, useThemeUI } from 'theme-ui'
import { chunk, sum } from 'lodash'
import SimpleReactLightbox, { SRLWrapper } from 'simple-react-lightbox'

// import Img from 'gatsby-image'

const GalleryGrid = ({
  title,
  parent,
  images,
  aspectRatio,
  itemsPerRow: itemsPerRowByBreakpoints,
}) => {
  const aspectRatios = images.map(image => image.fluid.aspectRatio)
  const rowAspectRatioSumsByBreakpoints = itemsPerRowByBreakpoints.map(
    itemsPerRow =>
      chunk(aspectRatios, itemsPerRow).map(rowAspectRatios =>
        sum(rowAspectRatios)
      )
  )

  const { theme } = useThemeUI()

  const options = {
    settings: {
      overlayColor: 'rgba(0, 0, 0, 0.9)',
      autoplaySpeed: 0,
      hideControlsAfter: false,
      disablePanzoom: false,
    },
    buttons: {
      backgroundColor: theme.colors.secondary,
      iconColor: theme.colors.text,
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
      window.analytics.track('Gallery Slide Changed', {
        image: object.slides.current.caption,
        src: object.slides.current.source,
        gallery: parent + ' — ' + title,
        direction: object.action,
      })
    }
    console.log(object)
    return object
  }

  function handleLightboxOpen(object) {
    if (typeof window !== 'undefined') {
      window.analytics.track('Gallery Opened', {
        image: object.currentSlide.caption,
        src: object.currentSlide.source,
        gallery: parent + ' — ' + title,
      })
    }

    return object
  }

  function handleLightboxClose(object) {
    if (typeof window !== 'undefined') {
      window.analytics.track('Gallery Closed', {
        image: object.currentSlide.caption,
        src: object.currentSlide.source,
        gallery: parent + ' — ' + title,
      })
    }

    return object
  }

  return (
    <>
      {title && (
        <p
          sx={{
            variant: 'styles.h2',
          }}
          key={title}
        >
          {title}
        </p>
      )}
      <center>
        <SimpleReactLightbox>
          <SRLWrapper options={options} callbacks={callbacks}>
            {images.map((image, i) => (
              <Link
                key={image.id}
                href={image.fluid.src}
                alt={image.title}
                data-attribute="SRL"
              >
                <Box
                  as={Image}
                  src={image.thumbnail.src}
                  title={image.title}
                  alt={image.title}
                  sx={{
                    width: rowAspectRatioSumsByBreakpoints.map(
                      (rowAspectRatioSums, j) => {
                        const rowIndex = Math.floor(
                          i / itemsPerRowByBreakpoints[j]
                        )
                        const rowAspectRatioSum = rowAspectRatioSums[rowIndex]
                        return `${(image.fluid.aspectRatio /
                          rowAspectRatioSum) *
                          100}%`
                      }
                    ),
                    maxWidth: '65%',
                    p: 2,
                  }}
                  css={{
                    display: 'inline-block',
                    verticalAlign: 'middle',
                  }}
                />
              </Link>
            ))}
          </SRLWrapper>
        </SimpleReactLightbox>
      </center>
    </>
  )
}
export default GalleryGrid
