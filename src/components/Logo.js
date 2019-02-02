import React from 'react'
import { Link } from 'gatsby'
import Headroom from 'react-headroom'

import { Box } from 'rebass'

const Logo = props => {
  return (
    <Headroom
      style={{
        zIndex: '899',
        transition: 'all .5s ease-in-out',
      }}
      className="menuHeadroom"
    >
      <Box p={[0]} className="logo">
        <Link to={`/`} className="noUnderline">
          <img src="/logos/logo_40pt.svg" className="logo" />
        </Link>
      </Box>
    </Headroom>
  )
}

export default Logo
