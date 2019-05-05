import React from 'react'

export const onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents([
    <link
      rel="dns-prefetch"
      key="dns-prefetch-google-analytics"
      href="https://www.google-analytics.com"
    />,
  ])
}
