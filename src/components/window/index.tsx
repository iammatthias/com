import { useState } from 'react';
import {
  windowWrapper,
  window,
  windowOverlay,
  windowOverlaySpanWrapper,
  windowOverlaySpanSmall,
  windowOverlaySpanLarge,
  windowOverlayHR,
  windowImage,
} from './window.css';
import Box from '@/components/Box';
import MagicFontWeight from '@/components/MagicFontWeight';
import Image from './image';

import { gql, useQuery } from '@apollo/client';
import { contentfulClient } from '@/utils/apolloProvider';
import getRandomInt from '@/utils/getRandomInt';
import Tilt from 'react-tilt';

const QUERY = gql`
  query ($title: String) {
    galleryCollection(where: { title: $title }) {
      items {
        title
        imagesCollection {
          items {
            url
            title
            height
            width
            contentType
          }
        }
      }
    }
  }
`;

export default function Window() {
  const [randomImageIndex, setRandomImageIndex] = useState(0);

  // data
  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      title: `MidJourney - Swirling Condensed Spacetime`,
    },
    client: contentfulClient,
  });

  if (loading) {
    return <p>loading...</p>;
  }

  if (error) {
    console.error(error);
    return null;
  }

  // data result - images
  const imageSet = data.galleryCollection.items[0].imagesCollection.items;
  const imageSetLength = imageSet.length;

  return (
    <Tilt className="Tilt" options={{ max: 3.82, scale: 1 }}>
      <Box className={`${windowWrapper}`}>
        <Box
          className={`${window}`}
          onMouseEnter={() => setRandomImageIndex(getRandomInt(imageSetLength))}
          // onMouseLeave={() => setRandomImageIndex(getRandomInt(imageSetLength))}
          onClick={() => setRandomImageIndex(getRandomInt(imageSetLength))}
        >
          <Box className={`${windowOverlay}`}>
            <Box className={`${windowOverlaySpanWrapper}`}>
              <Box as="h1" className={`${windowOverlaySpanSmall}`}>
                <MagicFontWeight>I am</MagicFontWeight>
              </Box>
              <Box as="hr" className={`${windowOverlayHR}`} />
            </Box>

            <Box as="h1" className={`${windowOverlaySpanLarge}`}>
              <MagicFontWeight>Matthias</MagicFontWeight>
            </Box>
          </Box>
          <Box className={`${windowImage}`}>
            <Image image={imageSet[randomImageIndex]} />
          </Box>
        </Box>
      </Box>
    </Tilt>
  );
}
