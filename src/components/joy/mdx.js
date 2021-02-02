/** @jsx jsx */
import { jsx, Box, Flex, Grid, Button, Heading, Text } from 'theme-ui';
import React from 'react'; //eslint-disable-line

import AM from 'react-music-embed';

import ClientOnly from './clientOnly';

import Sparkle from './sparkle';

import Gallery from './gallery';

import Link from './link';

import PageList from './pageList';

export const MDXGlobalComponents = {
  Box: (props) => <Box {...props} />,

  Flex: (props) => <Flex {...props} />,

  Grid: (props) => <Grid {...props} />,

  Button: (props) => <Button {...props} />,

  Heading: (props) => <Heading {...props} />,

  Text: (props) => <Text {...props} />,

  Link: (props) => <Link {...props} />,

  PageList: (props) => (
    <ClientOnly>
      <PageList {...props} />
    </ClientOnly>
  ),

  Sparkle: (props) => <Sparkle {...props} />,

  Spicy: (props) => (
    <span {...props} sx={{ fontFamily: 'cursive', color: 'primary' }} />
  ),

  Mono: (props) => <span {...props} sx={{ fontFamily: 'monospace' }} />,

  Gallery: (props) => (
    <ClientOnly>
      <Gallery {...props} />
    </ClientOnly>
  ),

  AM: (props) => <AM {...props} />,
};
