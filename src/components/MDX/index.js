import React from 'react'

import {
  Box,
  Flex,
  Grid,
  Button,
  Text,
  Heading,
  Link,
  Image,
  Card,
} from 'theme-ui'

import ContactForm from '../../components/contactForm'

export const MDXGlobalComponents = {
  // eslint-disable-next-line react/display-name
  Box: props => <Box {...props} />,
  // eslint-disable-next-line react/display-name
  Flex: props => <Flex {...props} />,
  // eslint-disable-next-line react/display-name
  Grid: props => <Grid {...props} />,
  // eslint-disable-next-line react/display-name
  Button: props => <Button {...props} />,
  // eslint-disable-next-line react/display-name
  Text: props => <Text {...props} />,
  // eslint-disable-next-line react/display-name
  Heading: props => <Heading {...props} />,
  // eslint-disable-next-line react/display-name
  Link: props => <Link {...props} />,
  // eslint-disable-next-line react/display-name
  Image: props => <Image {...props} />,
  // eslint-disable-next-line react/display-name
  Card: props => <Card {...props} />,
  ContactForm,
}
