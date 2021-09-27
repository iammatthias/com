/** @jsxImportSource theme-ui */
import { MDXProvider } from '@mdx-js/react'
import Link from 'next/link'
import { Box, Flex, Grid, Button, Heading, Text, Card } from 'theme-ui'
import Gallery from './gallery'
import PageList from './pageList'
import Sparkle from './sparkle'
import Spicy from './spicy'
import Vimeo from '@u-wave/react-vimeo'
import AppleMusic from 'react-music-embed'
import EmailCapture from './emailCapture'
import ClientOnly from './clientOnly'
import MobileOnly from './mobileOnly'
import Squiggle from './squiggle'

const mdComponents = {
  // theme-ui
  Box: props => <Box {...props} />,
  Flex: props => <Flex {...props} />,
  Grid: props => <Grid {...props} />,
  Button: props => <Button {...props} />,
  Heading: props => <Heading {...props} />,
  Text: props => <Text {...props} />,
  Card: props => <Card {...props} />,

  // text
  p: props => <p {...props} />, //eslint-disable-line
  h1: props => <h1 {...props} />, //eslint-disable-line
  h2: props => <h2 {...props} />, //eslint-disable-line
  h3: props => <h3 {...props} />, //eslint-disable-line
  h4: props => <h4 {...props} />, //eslint-disable-line
  h5: props => <h5 {...props} />, //eslint-disable-line
  small: props => <small {...props} />, //eslint-disable-line
  span: props => <span {...props} />, //eslint-disable-line

  // Text Modifiers
  Sparkle: props => <Sparkle {...props} />,
  Spicy: props => <Spicy {...props} sx={{ fontFamily: 'heading' }} />,
  Mono: props => <span {...props} sx={{ fontFamily: 'monospace' }} />,

  // etc
  Link: props => <Link {...props} />,
  Email: props => <EmailCapture {...props} />,
  PageList: props => <PageList {...props} />,
  Squiggle: props => <Squiggle {...props} />,
  MobileOnly: props => <MobileOnly {...props} />,
  Gallery: props => (
    <ClientOnly>
      <Gallery {...props} />
    </ClientOnly>
  ),
  AM: props => <AppleMusic {...props} />,
  Vimeo: props => (
    <Vimeo
      {...props}
      responsive
      autoplay={true}
      muted={true}
      loop={true}
      autopause={false}
      showTitle={false}
      showPortrait={false}
      showByline={false}
    />
  ),
}

const mdxProvider = ({ children }) => (
  <MDXProvider components={mdComponents}>{children}</MDXProvider>
)
export default mdxProvider
