import React from 'react'
import { Link } from 'gatsby'
import Headroom from 'react-headroom'

const Logo = props => {
  return (
    <Headroom
      style={{
        zIndex: '899',
        transition: 'all .5s ease-in-out',
      }}
      className="menuHeadroom"
    >
      <Link to={`/`} className="noUnderline">
        <img src="/logos/logo_40pt.svg" className="logo" />
      </Link>
    </Headroom>
  )
}

export default Logo
