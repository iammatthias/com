/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { graphql } from 'gatsby';
import { GatsbyImage, getSrc } from 'gatsby-plugin-image';
import { jsx, Link } from 'theme-ui';
import { XMasonry, XBlock } from 'react-xmasonry';
import SimpleReactLightbox, { SRLWrapper } from 'simple-react-lightbox';

import { useLocation } from '@reach/router';

import { track } from '../hooks/use-segment';

export default function Gallery({ masonrySet, ratio, masonry }) {
  const { pathname } = useLocation();
  const percent = Math.floor(eval(ratio) * 100);
  const match = masonry.find((masonry) => masonry.title === masonrySet);
  if (!match) {
    return null;
  }

  const pageType = masonry.pageType;
  console.log({ pageType });

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
      track('Image Viewed', {
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
      track('Image Viewed', {
        src: object.currentSlide.source,
        location: pathname,
        event: 'Lightbox Opened',
      });
    }

    return object;
  }

  function handleLightboxClose(object) {
    if (typeof window !== 'undefined') {
      track('Image Viewed', {
        src: object.currentSlide.source,
        location: pathname,
        event: 'Lightbox Closed',
      });
    }

    return object;
  }

  return (
    <SimpleReactLightbox key={match.id}>
      {pathname.includes('/photography/') ? (
        <>
          <h3 sx={{ margin: '0', padding: '0' }}>{match.title}</h3>
          <p>Last Updated: {match.updatedAt}</p>
        </>
      ) : null}
      <SRLWrapper options={options} callbacks={callbacks}>
        <XMasonry
          targetBlockWidth={
            match.images.length === 1
              ? '1000'
              : match.images.length === 2
              ? '600'
              : match.images.length === 3
              ? '350'
              : match.images.length === 4
              ? '300'
              : match.images.length >= 5 && '300'
          }
        >
          {match.images.map((image, i) => (
            <XBlock key={i}>
              <Link
                href={getSrc(image.gatsbyImageData)}
                alt={image.title}
                data-attribute="SRL"
              >
                <GatsbyImage
                  image={image.thumbnail}
                  alt={image.title}
                  sx={{
                    ...(ratio ? { paddingTop: percent + '% !important' } : ''),
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

export const query = graphql`
  fragment Masonry on ContentfulPage {
    pageType
    masonry {
      id
      title
      updatedAt(formatString: "MMMM Do, YYYY")
      images {
        title
        gatsbyImageData(layout: FULL_WIDTH, placeholder: BLURRED)
        thumbnail: gatsbyImageData(
          width: 500
          layout: FULL_WIDTH
          placeholder: BLURRED
        )
      }
    }
  }
`;
