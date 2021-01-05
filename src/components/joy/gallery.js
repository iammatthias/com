/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import Img from 'gatsby-image';
import { useStaticQuery, graphql } from 'gatsby';
import { jsx, Box, Link, Styled } from 'theme-ui';
import { XMasonry, XBlock } from 'react-xmasonry';
import SimpleReactLightbox, { SRLWrapper } from 'simple-react-lightbox';

export default function Gallery({ masonrySet, lightbox, ratio }) {
  const { allContentfulPage } = useStaticQuery(graphql`
    query {
      allContentfulPage {
        edges {
          node {
            masonry {
              title
              images {
                title
                fluid {
                  ...GatsbyContentfulFluid_withWebp
                  aspectRatio
                  src
                  srcSet
                }
              }
            }
          }
        }
      }
    }
  `);

  const match = allContentfulPage.edges.find(
    (edge) => edge.node.masonry[0].title === masonrySet
  );
  if (!match) {
    // console.log(match);
    return null;
  }

  // get decimal from `ratio` (aspect ratio prop returns a fraction)
  const r = eval(ratio);

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

  return (
    <>
      {lightbox ? (
        <>
          {match.node.masonry.map((mason) => (
            <Box
              key={mason.title}
              sx={{
                paddingBottom: '2rem',
                borderBottom: '1px solid',
                borderColor: 'inherit',
              }}
            >
              {mason.title && (
                <>
                  <Styled.h2 key={mason.title}>{mason.title}</Styled.h2>
                  <Styled.p>Click on the image for a better view.</Styled.p>
                </>
              )}
              <SimpleReactLightbox>
                {/* <SRLWrapper options={options} callbacks={callbacks}> */}
                <SRLWrapper options={options}>
                  <XMasonry targetBlockWidth="225">
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
          ))}
        </>
      ) : (
        <>
          {match.node.masonry.map((mason) =>
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
            ))
          )}
        </>
      )}
    </>
  );
}
