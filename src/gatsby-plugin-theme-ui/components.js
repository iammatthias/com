/** @jsx jsx */
import { jsx, Box, Flex, Grid, Button, Heading, Text } from 'theme-ui';
import React from 'react'; //eslint-disable-line

import ClientOnly from '../components/clientOnly';
import Gallery from '../components/gallery';
import PageList from '../components/pageList';
import Link from '../components/link';
import Sparkle from '../components/sparkle';
import AppleMusic from 'react-music-embed';
import Vimeo from '@u-wave/react-vimeo';

const components = {
  // theme-ui
  Box: (props) => <Box {...props} />,
  Flex: (props) => <Flex {...props} />,
  Grid: (props) => <Grid {...props} />,
  Button: (props) => <Button {...props} />,
  Heading: (props) => <Heading {...props} />,
  Text: (props) => <Text {...props} />,

  //custom
  Sparkle: (props) => <Sparkle {...props} />,
  Spicy: (props) => (
    <span {...props} sx={{ fontFamily: 'cursive', color: 'primary' }} />
  ),
  Mono: (props) => <span {...props} sx={{ fontFamily: 'monospace' }} />,
  Link: (props) => <Link {...props} />,
  PageList: (props) => (
    <ClientOnly>
      <PageList {...props} />
    </ClientOnly>
  ),
  Gallery: (props) => (
    <ClientOnly>
      <Gallery {...props} />
    </ClientOnly>
  ),

  //helpers
  AM: (props) => <AppleMusic {...props} />,
  Vimeo: (props) => (
    <Vimeo
      {...props}
      responsive
      autoplay="true"
      muted="true"
      loop="true"
      autopause="false"
      showTitle="false"
      showPortrait="false"
      showByline="false"
    />
  ),
};
export default components;
