/** @jsx jsx */

import { jsx, Box, Flex, Grid, Button, Heading } from 'theme-ui';

import Sparkle from './sparkle';

import Gallery from './gallery';

import Link from './link';

import List from './list';

export const MDXGlobalComponents = {
  Box: (props) => <Box {...props} />,

  Flex: (props) => <Flex {...props} />,

  Grid: (props) => <Grid {...props} />,

  Button: (props) => <Button {...props} />,

  Text: (props) => <Heading {...props} />,

  Link: (props) => <Link {...props} />,

  List: (props) => <List {...props} />,

  Sparkle: (props) => <Sparkle {...props} />,

  Spicy: (props) => (
    <span {...props} sx={{ fontFamily: 'cursive', color: 'primary' }} />
  ),

  Mono: (props) => <span {...props} sx={{ fontFamily: 'monospace' }} />,

  Gallery: (props) => <Gallery {...props} />,
};
