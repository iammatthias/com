/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Styled, Box, Flex } from 'theme-ui'

import Logo from '../components/Logo'

const Covid = ({ title }) => {
  return (
    <Flex
      sx={{ background: 'black', minHeight: '100vh', height: '100%', pb: 5 }}
    >
      <Box
        sx={{
          m: [3, 4, 5],
          px: 2,
          py: 3,
          width: ['100%', '61.8%', '61.8%', '38.2%'],
        }}
      >
        <Logo css={{ stroke: 'white !important', fill: 'black !important' }} />

        <Styled.p sx={{ fontFamily: 'monospace', color: 'white' }}>
          {title}
        </Styled.p>
      </Box>
    </Flex>
  )
}

export default Covid
