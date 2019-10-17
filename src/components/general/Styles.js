import React from 'react'
import Reset from '../../styles/reset'
import ColorStyle from '../../styles/colors'
import GlobalStyle from '../../styles/global'
import ArticleStyle from '../../styles/article'
import TextStyle from '../../styles/text'

const _Helmet = props => {
  return (
    <>
      <Reset />
      <ColorStyle />
      <TextStyle />
      <GlobalStyle />
      <ArticleStyle />
    </>
  )
}

export default _Helmet
