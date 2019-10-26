import React from 'react'

import YouTube from 'react-youtube'

import Link from './Link'

import Subscribe from './Subscribe'

import Alert from './Alert'

export const MDXGlobalComponents = {
  // eslint-disable-next-line react/display-name
  Alert: props => <Alert {...props} />,
  // eslint-disable-next-line react/display-name
  Subscribe: props => <Subscribe title={props.title} />,
  Link,
  YouTube,
}
