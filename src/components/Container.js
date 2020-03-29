import React from 'react'
import styled from '@emotion/styled'

const Section = styled.section`
  margin: 0 auto auto;
  width: 100%;
  padding: 3em 1.5em 2em;
  flex-grow: 1;
`

const Container = props => {
  return <Section>{props.children}</Section>
}

export default Container
