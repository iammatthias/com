import React from 'react'

import YouTube from 'react-youtube'

import Link from './Link'

import Subscribe from './Subscribe'

export const MDXGlobalComponents = {
  // eslint-disable-next-line react/display-name
  Subscribe: props => <Subscribe title={props.title} />,
  Link,
  YouTube,
}
