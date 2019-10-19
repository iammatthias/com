import React from 'react'
import Reset from '../../styles/reset'
import ColorStyle from '../../styles/colors'
import GlobalStyle from '../../styles/global'
import TextStyle from '../../styles/text'

const _Helmet = props => {
  return (
    <>
      <Reset />
      <ColorStyle />
      <TextStyle />
      <GlobalStyle />
    </>
  )
}

export default _Helmet
