/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { GatsbyImage, getSrc } from 'gatsby-plugin-image';
import { jsx, Link } from 'theme-ui';
import { XMasonry, XBlock } from 'react-xmasonry';
import SimpleReactLightbox, { SRLWrapper } from 'simple-react-lightbox';

import { useLocation } from '@reach/router';

import { useSiteMetadata } from '../../hooks/use-site-metadata-galleries';

export default function Gallery({ masonrySet, ratio }) {
  const { galleries } = useSiteMetadata();

  const { pathname } = useLocation();

  const match = galleries.edges.find((edge) => edge.node.title === masonrySet);
  if (!match) {
    // console.log(match);
    return null;
  }

  console.log(ratio);

  function reverseString(str) {
    return str === '' ? '' : reverseString(str.substr(1)) + str.charAt(0);
  }

  const reverseRatio = ratio ? reverseString(ratio) : '0';

  // get decimal from `ratio` (aspect ratio prop returns a fraction)
  const r = eval(reverseRatio === 'denifednu' ? '0' : reverseRatio); //eslint-disable-line

  const percent = Math.floor(r * 100);

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

  const callbacks = {
    onSlideChange: (object) => handleSlideChange(object),
    onLightboxOpened: (object) => handleLightboxOpen(object),
    onLightboxClosed: (object) => handleLightboxClose(object),
  };

  function handleSlideChange(object) {
    if (typeof window !== 'undefined') {
      window.analytics.track('Image Viewed', {
        src: object.slides.current.source,
        location: pathname,
        direction: object.action,
        event: 'Lightbox Slide Changed',
      });
    }

    return object;
  }

  function handleLightboxOpen(object) {
    if (typeof window !== 'undefined') {
      window.analytics.track('Image Viewed', {
        src: object.currentSlide.source,
        location: pathname,
        event: 'Lightbox Opened',
      });
    }

    return object;
  }

  function handleLightboxClose(object) {
    if (typeof window !== 'undefined') {
      window.analytics.track('Image Viewed', {
        src: object.currentSlide.source,
        location: pathname,
        event: 'Lightbox Closed',
      });
    }

    return object;
  }

  return (
    <SimpleReactLightbox key={match.node.id}>
      {pathname.includes('/photography/') ? (
        <>
          <h3 sx={{ margin: '0', padding: '0' }}>{match.node.title}</h3>
          <p>Last Updated: {match.node.updatedAt}</p>
        </>
      ) : null}
      <SRLWrapper options={options} callbacks={callbacks}>
        <XMasonry
          targetBlockWidth={
            match.node.images.length === 1
              ? '900'
              : match.node.images.length === 2
              ? '600'
              : match.node.images.length === 3
              ? '350'
              : match.node.images.length === 4
              ? '300'
              : match.node.images.length >= 5 && '300'
          }
        >
          {match.node.images.map((image, i) => (
            <XBlock key={i}>
              <Link
                href={getSrc(image.gatsbyImageData)}
                alt={image.title}
                data-attribute="SRL"
              >
                <GatsbyImage
                  image={image.gatsbyImageData}
                  alt={image.title}
                  sx={{
                    ...(ratio
                      ? { div: { paddingTop: percent + '% !important' } }
                      : ''),
                  }}
                />
              </Link>
            </XBlock>
          ))}
        </XMasonry>
      </SRLWrapper>
    </SimpleReactLightbox>
  );
}
