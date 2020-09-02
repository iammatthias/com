/** @jsx jsx */

import React from 'react' //eslint-disable-line

import {
  jsx,
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

import ContactForm from '../components/ContactForm'

import EmailCapture from '../components/MDX/EmailCapture'

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
  Image: props => (
    <Image
      {...props}
      sx={{
        background: theme => `${theme.colors.secondary}`,
        boxShadow: theme =>
          `5px -5px 35px ${theme.colors.background}, 5px 5px 35px ${theme.colors.shadow}`,
        border: '1px solid',
        borderColor: 'inherit',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    />
  ),
  // eslint-disable-next-line react/display-name
  Card: props => <Card {...props} />,
  // eslint-disable-next-line react/display-name
  ContactForm: props => <ContactForm {...props} />,
  // eslint-disable-next-line react/display-name
  EmailCapture: props => <EmailCapture {...props} />,
}
