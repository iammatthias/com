/** @jsx jsx */
import { jsx, Box, Flex, Grid, Button, Heading } from 'theme-ui';
import * as React from 'react'; //eslint-disable-line

import AM from 'react-music-embed';

import Sparkle from './sparkle';

// import Gallery from './lazyGallery';

import Gallery from './gallery';

import Link from './link';

import PageList from './pageList';

export const MDXGlobalComponents = {
  Box: (props) => <Box {...props} />,

  Flex: (props) => <Flex {...props} />,

  Grid: (props) => <Grid {...props} />,

  Button: (props) => <Button {...props} />,

  Text: (props) => <Heading {...props} />,

  Link: (props) => <Link {...props} />,

  PageList: (props) => <PageList {...props} />,

  Sparkle: (props) => <Sparkle {...props} />,

  Spicy: (props) => (
    <span {...props} sx={{ fontFamily: 'cursive', color: 'primary' }} />
  ),

  Mono: (props) => <span {...props} sx={{ fontFamily: 'monospace' }} />,

  Gallery: (props) => <Gallery {...props} />,

  AM: (props) => <AM {...props} />,
};
