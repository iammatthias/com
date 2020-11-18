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

import { alpha } from '@theme-ui/color'

import ContactForm from '../components/ContactForm'

import EmailCapture from '../components/MDX/EmailCapture'

import Sparkle from '../components/MDX/Sparkle'

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
  Link: props => (
    <Link
      {...props}
      sx={{
        p: '0 3px',
        border: '1px solid',
        borderColor: 'shadow',
        borderRadius: '4px',
        backgroundImage: t => `
        linear-gradient(217deg, ${alpha('red', 0.5)(t)}, ${alpha(
          'text',
          0.05
        )(t)} 70.71%),
            linear-gradient(127deg, ${alpha('blue', 0.5)(t)}, ${alpha(
          'background',
          0.05
        )(t)} 70.71%),
            linear-gradient(336deg, ${alpha('yellow', 0.5)(t)}, ${alpha(
          'shadow',
          0.05
        )(t)} 70.71%)
    `,
        animation: 'rotation 2s infinite linear',
        boxDecorationBreak: 'clone',
      }}
    />
  ),
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
  // eslint-disable-next-line react/display-name
  Sparkle: props => <Sparkle {...props} />,
  // eslint-disable-next-line react/display-name
  Spicy: props => (
    <span {...props} sx={{ fontFamily: 'cursive', color: 'red' }} />
  ),
  // eslint-disable-next-line react/display-name
  Mono: props => <span {...props} sx={{ fontFamily: 'mono' }} />,
}
