/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Link, useThemeUI } from 'theme-ui'
import SimpleReactLightbox, { SRLWrapper } from 'simple-react-lightbox'

import { XMasonry, XBlock } from 'react-xmasonry'

import Img from 'gatsby-image'

const GalleryGrid = ({ title, parent, images, aspectRatio }) => {
  const { theme } = useThemeUI()

  const options = {
    settings: {
      overlayColor: 'rgba(0, 0, 0, 0.9)',
      autoplaySpeed: 0,
      hideControlsAfter: false,
      disablePanzoom: true,
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
      window.analytics.track('Image Viewed', {
        image: object.slides.current.caption,
        src: object.slides.current.source,
        location: parent + ' — ' + title,
        direction: object.action,
        event: 'Gallery Slide Changed',
      })
    }
    console.log(object)
    return object
  }

  function handleLightboxOpen(object) {
    if (typeof window !== 'undefined') {
      window.analytics.track('Image Viewed', {
        image: object.currentSlide.caption,
        src: object.currentSlide.source,
        location: parent + ' — ' + title,
        event: 'Galery Opened',
      })
    }

    return object
  }

  function handleLightboxClose(object) {
    if (typeof window !== 'undefined') {
      window.analytics.track('Image Viewed', {
        image: object.currentSlide.caption,
        src: object.currentSlide.source,
        location: parent + ' — ' + title,
        event: 'Galery Closed',
      })
    }

    return object
  }

  return (
    <>
      {title && (
        <>
          <p
            sx={{
              variant: 'styles.h2',
            }}
            key={title}
          >
            {title}
          </p>
          <p
            sx={{
              variant: 'styles.p',
            }}
          >
            Click on the image for a better view.
          </p>
        </>
      )}
      <center>
        <SimpleReactLightbox>
          <SRLWrapper options={options} callbacks={callbacks}>
            <XMasonry targetBlockWidth="200">
              {images.map((image, i) => (
                <XBlock key={image.id}>
                  <Link
                    href={image.fluid.src}
                    alt={image.title}
                    data-attribute="SRL"
                  >
                    <Img
                      fluid={image.thumbnail}
                      title={image.title}
                      alt={image.title}
                      sx={{
                        m: 2,
                        boxShadow: theme =>
                          `5px -5px 35px ${theme.colors.background}, 5px 5px 35px ${theme.colors.shadow}`,
                        border: '1px solid',
                        borderColor: 'inherit',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    />
                  </Link>
                </XBlock>
              ))}
            </XMasonry>
          </SRLWrapper>
        </SimpleReactLightbox>
      </center>
    </>
  )
}
export default GalleryGrid
