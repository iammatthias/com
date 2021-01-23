/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import Img from 'gatsby-image';
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

  // get decimal from `ratio` (aspect ratio prop returns a fraction)
  const r = eval(ratio); //eslint-disable-line

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

  console.log(pathname);

  return (
    <SimpleReactLightbox key={match.node.id}>
      {pathname.includes('/photography/') ? (
        <>
          <h2 sx={{ margin: '0', padding: '0' }}>{match.node.title}</h2>
          <p>{match.node.updatedAt}</p>
        </>
      ) : null}
      <SRLWrapper options={options}>
        <XMasonry
          targetBlockWidth={
            match.node.images.length === 1
              ? '900'
              : match.node.images.length === 2
              ? '600'
              : match.node.images.length === 3
              ? '350'
              : match.node.images.length >= 4 && '300'
          }
        >
          {match.node.images.map((image, i) => (
            <XBlock key={i}>
              <Link
                href={image.fluid.srcSet}
                alt={image.title}
                data-attribute="SRL"
              >
                <Img
                  fluid={{
                    ...image.fluid,
                    aspectRatio: r ? r : image.fluid.aspectRatio,
                  }}
                  title={image.title}
                  alt={image.title}
                />
              </Link>
            </XBlock>
          ))}
        </XMasonry>
      </SRLWrapper>
    </SimpleReactLightbox>
  );
}
