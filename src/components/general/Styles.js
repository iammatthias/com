import React from 'react'
import Reset from '../../styles/reset'
import ColorStyle from '../../styles/colors'
import GlobalStyle from '../../styles/global'
import Helpers from '../../styles/helpers'

const _Helmet = props => {
  return (
    <>
      <Reset />
      <ColorStyle />
      <GlobalStyle />
      <Helpers />
    </>
  )
}

export default _Helmet
