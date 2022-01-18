/** @jsxImportSource theme-ui */
import { MDXProvider } from '@mdx-js/react'
import Link from 'next/link'
import { Box, Flex, Grid, Button, Heading, Text, Card } from 'theme-ui'
import Gallery from './gallery/gallery'
import PageList from './pageList'
import Vimeo from '@u-wave/react-vimeo'
import AppleMusic from 'react-music-embed'
import EmailCapture from './capture/emailCapture'
import GuestbookCapture from './capture/guestbookCapture'
import GuestCapture from './capture/guestCapture'
import ClientOnly from './helpers/clientOnly'
import MobileOnly from './helpers/mobileOnly'
import DesktopOnly from './helpers/desktopOnly'
import Sparkle from './joy/sparkle'
import Spicy from './joy/spicy'
import Squiggle from './joy/squiggle'
import Code from './joy/code'

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
  // Sparkle: props => <span {...props} />,
  Spicy: props => <Spicy {...props} />,
  Mono: props => <span {...props} sx={{ fontFamily: 'monospace' }} />,
  Code: props => <Code {...props} />,

  // etc
  Link: props => <Link {...props} />,
  EmailCapture: props => <EmailCapture {...props} />,
  GuestbookCapture: props => <GuestbookCapture {...props} />,
  GuestCapture: props => <GuestCapture {...props} />,
  PageList: props => <PageList {...props} />,
  Squiggle: props => <Squiggle {...props} />,
  MobileOnly: props => <MobileOnly {...props} />,
  DesktopOnly: props => <DesktopOnly {...props} />,
  Gallery: props => (
    <ClientOnly className="gallery">
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
