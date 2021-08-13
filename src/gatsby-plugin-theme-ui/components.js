/** @jsx jsx */
import { jsx, Box, Flex, Grid, Button, Heading, Text } from 'theme-ui';
import React from 'react'; //eslint-disable-line
import loadable from '@loadable/component';

//helpers
import Vimeo from '@u-wave/react-vimeo';
import AppleMusic from 'react-music-embed';

//loadable
// custom
const Gallery = loadable(() => import('../components/gallery'));
const PageList = loadable(() => import('../components/pageList'));
const Link = loadable(() => import('../components/link'));
const Sparkle = loadable(() => import('../components/sparkle'));
const EmailCapture = loadable(() => import('../components/emailCapture'));

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

  PageList: (props) => <PageList {...props} />,
  Gallery: (props) => <Gallery {...props} />,
  Email: (props) => <EmailCapture {...props} />,

  //helpers
  AM: (props) => <AppleMusic {...props} />,
  Vimeo: (props) => (
    <Vimeo
      {...props}
      responsive
      autoplay={true}
      muted={true}
      loop={true}
      autopause={false}
      showTitle={false}
      showPortrait={false}
      showByline={false}
    />
  ),

  // text
  p: (props) => <p {...props} />, //eslint-disable-line
  h1: (props) => <h1 {...props} />, //eslint-disable-line
  h2: (props) => <h2 {...props} />, //eslint-disable-line
  h3: (props) => <h3 {...props} />, //eslint-disable-line
  h4: (props) => <h4 {...props} />, //eslint-disable-line
  h5: (props) => <h5 {...props} />, //eslint-disable-line
  small: (props) => <small {...props} />, //eslint-disable-line
};
export default components;
