import { MDXProvider } from '@mdx-js/react'

// primitives
import Box from '@/components/primitives/box'

// text
import P from '@/components/primitives/text/P'
import H1 from '@/components/primitives/text/H1'
import H2 from '@/components/primitives/text/H2'
import H3 from '@/components/primitives/text/H3'
import H4 from '@/components/primitives/text/H4'
import H5 from '@/components/primitives/text/H5'
import Small from '@/components/primitives/text/small'
import Pre from '@/components/primitives/text/pre'
import Code from '@/components/primitives/text/code'
import Span from '@/components/primitives/text/Span'
import Mono from '@/components/joy/mono'

// blocks
import PageList from '@/components/blocks/pageList'

// etc
import Anchor from '@/components/primitives/text/Anchor'
import Squiggle from '@/components/joy/squiggle'
import Sparkles from '@/components/joy/sparkle'
import Spicy from '@/components/joy/spicy'
import Vimeo from '@u-wave/react-vimeo'
import Gallery from '@/components/blocks/gallery'

const mdComponents = {
  // primitives
  Box: (props: any) => <Box {...props} />,

  // text
  p: (props: any) => <P {...props} />,
  P: (props: any) => <P {...props} />,
  h1: (props: any) => <H1 {...props} />,
  H1: (props: any) => <H1 {...props} />,
  h2: (props: any) => <H2 {...props} />,
  H2: (props: any) => <H2 {...props} />,
  h3: (props: any) => <H3 {...props} />,
  H3: (props: any) => <H3 {...props} />,
  h4: (props: any) => <H4 {...props} />,
  H4: (props: any) => <H4 {...props} />,
  h5: (props: any) => <H5 {...props} />,
  H5: (props: any) => <H5 {...props} />,
  small: (props: any) => <Small {...props} />,
  span: (props: any) => <Span {...props} />,
  pre: (props: any) => <Pre {...props} />,
  code: (props: any) => <Code {...props} />,
  Code: (props: any) => <Code {...props} />,

  // blocks
  PageList: (props: any) => <PageList {...props} />,
  Gallery: (props: any) => <Gallery {...props} />,

  // etc
  Link: (props: any) => <Anchor {...props} />,
  Anchor: (props: any) => <Anchor {...props} />,
  Squiggle: (props: any) => <Squiggle {...props} />,
  Sparkle: (props: any) => <Sparkles {...props} />,
  Spicy: (props: any) => <Spicy {...props} />,
  Mono: (props: any) => <Mono {...props} />,
  Vimeo: (props: any) => (
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

const MDX = ({ children }: any) => (
  <MDXProvider components={mdComponents}>{children}</MDXProvider>
)
export default MDX
