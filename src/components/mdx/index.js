import React from 'react'

import YouTube from 'react-youtube'

import Paragraph from './Paragraph'

import Link from './Link'

export const MDXLayoutComponents = {
  p: props => <Paragraph {...props} />,
}

export const MDXGlobalComponents = {
  Link,
  YouTube,
}
