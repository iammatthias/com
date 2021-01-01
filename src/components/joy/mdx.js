/** @jsx jsx */

import { jsx, Box, Flex, Grid, Button, Text, Heading } from 'theme-ui';
import Sparkle from './sparkle';

export const MDXGlobalComponents = {
  Box: (props) => <Box {...props} />,

  Flex: (props) => <Flex {...props} />,

  Grid: (props) => <Grid {...props} />,

  Button: (props) => <Button {...props} />,

  Text: (props) => <Text {...props} />,

  Heading: (props) => <Heading {...props} />,

  Sparkle: (props) => <Sparkle {...props} />,
  Spicy: (props) => (
    <span {...props} sx={{ fontFamily: 'cursive', color: 'red' }} />
  ),
  Mono: (props) => <span {...props} sx={{ fontFamily: 'monospace' }} />,
};
