import React from 'react'
import { Link } from 'gatsby'
import Logo from './Logo'
import styled from 'styled-components'
import Headroom from 'react-headroom'

const Content = styled.div`
  grid-area: Content;

  margin: 2rem 2rem 0;
  height: 5rem;
  section {
    display: flex;

    align-items: center;
    justify-content: space-between;
    margin: 1rem auto;
  }
  @media screen and (min-width: 52em) {
    section {
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64em) {
    section {
      width: 61.8%;
    }
  }
`

const Menu = props => {
  return (
    <Headroom
      style={{
        position: 'fixed',
        zIndex: '300',
        transition: 'all .5s ease-in-out',
      }}
    >
      <Content>
        <section>
          <Logo />
          <p>
            <Link to="/">Galleries</Link>&nbsp;&nbsp;&nbsp;
            <Link to="/blog">Blog</Link>&nbsp;&nbsp;&nbsp;
            <Link to="/contact" className="hide-inline">
              Contact
            </Link>
          </p>
        </section>
      </Content>
    </Headroom>
  )
}

export default Menu
