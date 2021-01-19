import React from 'react';

import { Box, Grid, Text } from 'theme-ui';

import Link from './joy/link';
import Logomark from './logomark';

const Menu = (props) => {
  return (
    <Grid
      sx={{
        gridTemplateRows: 'auto',
        gridTemplateColumns: ['1fr', '1fr 1fr'],
        marginBottom: '2rem',
      }}
    >
      <Box>
        {/* <Text as="h3">
          <Link href="/">I am Matthias</Link>
        </Text> */}
        <Logomark />
      </Box>
      <Box sx={{ textAlign: ['left', 'right'] }}>
        <Text as="h4">
          <Link href="/photography/">Photography</Link>{' '}
          <Link href="/blog/">Blog</Link>
          {'  '}
          <Link href="/about/">About</Link>
        </Text>
      </Box>
    </Grid>
  );
};

export default Menu;
