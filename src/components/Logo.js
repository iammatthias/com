import React from 'react'
import { Link } from 'gatsby'

import { Box } from 'rebass'

const Logo = props => {
  return (
    <Box px={[3, 4]} py={2} className="hide logo">
      <Link to={`/`} className="noUnderline">
        <img src="/logos/logo_40pt.png" className="logo" />
      </Link>
    </Box>
  )
}

export default Logo
