import React from 'react'

import Logo from '../general/Logo'
import styled from 'styled-components'
import Headroom from 'react-headroom'

const Content = styled.div`
  grid-area: Content;
  display: flex;
  flex-direction: column;
  margin: 2rem 2rem 0;
  height: 5rem;
  @media screen and (min-width: 52em) {
    align-items: center;
    justify-content: center;
    margin: 1rem;
    section {
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64em) {
    margin: 1rem 1rem 0;
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
        </section>
      </Content>
    </Headroom>
  )
}

export default Menu
