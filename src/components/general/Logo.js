import React from 'react'
import { Link } from 'gatsby'

import styled from 'styled-components'

const A = styled(Link)`
  padding: 0;
  img {
    width: 3.5em;
  }
`

const Logo = props => {
  return (
    <A to={`/`} className="noUnderline" alt="I Am Matthias">
      <img
        src="/logos/logo_40pt.svg"
        className="logo"
        alt="I Am Matthias"
        width="auto"
      />
    </A>
  )
}

export default Logo
