/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import Img from 'gatsby-image';
import { jsx, Box, Link } from 'theme-ui';
import { XMasonry, XBlock } from 'react-xmasonry';
import SimpleReactLightbox, { SRLWrapper } from 'simple-react-lightbox';

import { useSiteMetadata } from '../../hooks/use-site-metadata';

export default function Gallery({ masonrySet, ratio }) {
  const { allContentfulPage } = useSiteMetadata();

  const match = allContentfulPage.edges.find(
    (edge) => edge.node.masonry[0].title === masonrySet
  );
  if (!match) {
    // console.log(match);
    return null;
  }

  // get decimal from `ratio` (aspect ratio prop returns a fraction)
  const r = eval(ratio); //eslint-disable-line

  // console.log(match.node.masonry, 'this is working');

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
  };

  // const callbacks = {
  //   onSlideChange: (object) => handleSlideChange(object),
  //   onLightboxOpened: (object) => handleLightboxOpen(object),
  //   onLightboxClosed: (object) => handleLightboxClose(object),
  // };

  // function handleSlideChange(object) {
  //   if (typeof window !== 'undefined') {
  //     window.analytics.track('Image Viewed', {
  //       image: object.slides.current.caption,
  //       src: object.slides.current.source,
  //       location: parent + ' — ' + title,
  //       direction: object.action,
  //       event: 'Gallery Slide Changed',
  //     });
  //   }
  //   console.log(object);
  //   return object;
  // }

  // function handleLightboxOpen(object) {
  //   if (typeof window !== 'undefined') {
  //     window.analytics.track('Image Viewed', {
  //       image: object.currentSlide.caption,
  //       src: object.currentSlide.source,
  //       location: parent + ' — ' + title,
  //       event: 'Galery Opened',
  //     });
  //   }

  //   return object;
  // }

  // function handleLightboxClose(object) {
  //   if (typeof window !== 'undefined') {
  //     window.analytics.track('Image Viewed', {
  //       image: object.currentSlide.caption,
  //       src: object.currentSlide.source,
  //       location: parent + ' — ' + title,
  //       event: 'Galery Closed',
  //     });
  //   }

  //   return object;
  // }

  return match.node.masonry.map((mason) =>
    mason.display === 'Lightbox' ? (
      <Box
        key={mason.title}
        sx={{
          paddingBottom: '2rem',
          borderBottom: '1px solid',
          borderColor: 'inherit',
        }}
      >
        <SimpleReactLightbox>
          {/* <SRLWrapper options={options} callbacks={callbacks}> */}
          <SRLWrapper options={options}>
            <XMasonry
              targetBlockWidth={
                mason.images.length === 1
                  ? '900'
                  : mason.images.length === 2
                  ? '600'
                  : mason.images.length === 3
                  ? '600'
                  : mason.images.length >= 4 && '250'
              }
            >
              {mason.images.map((image, i) => (
                <XBlock key={i}>
                  <Link
                    href={image.fluid.srcSet}
                    alt={image.title}
                    data-attribute="SRL"
                  >
                    <Img
                      fluid={image.fluid}
                      title={image.title}
                      alt={image.title}
                    />
                  </Link>
                </XBlock>
              ))}
            </XMasonry>
          </SRLWrapper>
        </SimpleReactLightbox>
      </Box>
    ) : (
      <Box
        key={mason.title}
        sx={{
          paddingBottom: '2rem',
          borderBottom: '1px solid',
          borderColor: 'inherit',
        }}
      >
        {mason.display === 'Single Image' &&
          mason.images.map((image, i) => (
            <Img
              key={i}
              fluid={{
                ...image.fluid,
                aspectRatio: r ? r : image.fluid.aspectRatio,
              }}
              title={image.title}
              alt={image.title}
            />
          ))}
      </Box>
    )
  );
}
