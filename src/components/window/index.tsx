import { useState, useEffect } from 'react';
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
import Tilt from 'react-parallax-tilt';

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
  const [scale, setScale] = useState(1);

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

  // check if platform is iOS
  const isIOS = () => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      return true;
    }
    return false;
  };

  // get motion event permission
  function getAccel() {
    (DeviceMotionEvent as any).requestPermission().then((response: any) => {
      if (response == `granted`) {
        // Add a listener to get smartphone acceleration
        // in the XYZ axes (units in m/s^2)
        (window as any).addEventListener(`devicemotion`, (event: any) => {
          console.log(event);
        });
        // Add a listener to get smartphone orientation
        // in the alpha-beta-gamma axes (units in degrees)
        (window as any).addEventListener(`deviceorientation`, (event: any) => {
          console.log(event);
        });
      }
    });
  }

  // handle click event for image window
  // if platform is iOS, get motion event permission
  function handleImageClick() {
    if (isIOS() === true) {
      getAccel();
    }
    setRandomImageIndex(getRandomInt(imageSetLength));
  }
  return (
    <Tilt
      scale={scale}
      perspective={2000}
      gyroscope={true}
      glareEnable={true}
      glareMaxOpacity={0.8}
      glarePosition="bottom"
      glareBorderRadius="8px"
    >
      <Box className={`${windowWrapper}`}>
        <Box
          className={`${window}`}
          onMouseEnter={() => setRandomImageIndex(getRandomInt(imageSetLength))}
          // onMouseLeave={() => setRandomImageIndex(getRandomInt(imageSetLength))}
          onClick={() => handleImageClick()}
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
