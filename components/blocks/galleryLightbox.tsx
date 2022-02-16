// gallery

import { useRouter } from 'next/router'
import SimpleReactLightbox, { SRLWrapper } from 'simple-react-lightbox'

declare global {
  var analytics: any
}

export default function Lightbox({ children }: any) {
  // get path for events
  const router = useRouter()
  const pathname = router.asPath

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
    onSlideChange: (object: any) => handleSlideChange(object),
    onLightboxOpened: (object: any) => handleLightboxOpen(object),
    onLightboxClosed: (object: any) => handleLightboxClose(object),
  }

  function handleSlideChange(object: any) {
    if (typeof window !== 'undefined') {
      global.analytics.track('Lightbox Slide Changed', {
        src: object.slides.current.source,
        location: pathname,
        direction: object.action,
      })
    }

    return object
  }

  function handleLightboxOpen(object: any) {
    if (typeof window !== 'undefined') {
      global.analytics.track('Lightbox Opened', {
        src: object.currentSlide.source,
        location: pathname,
      })
    }

    return object
  }

  function handleLightboxClose(object: any) {
    if (typeof window !== 'undefined') {
      global.analytics.track('Lightbox Closed', {
        src: object.currentSlide.source,
        location: pathname,
      })
    }

    return object
  }

  return (
    <SimpleReactLightbox>
      <SRLWrapper options={options} callbacks={callbacks}>
        {children}
      </SRLWrapper>
    </SimpleReactLightbox>
  )
}
