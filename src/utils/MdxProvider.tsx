import { MDXProvider } from '@mdx-js/react';
// import Spicy from '@/components/joy/spicy';
import Vimeo from '@u-wave/react-vimeo';
import Link from 'next/link';
import { Tweet } from 'react-static-tweets';

// import ClientOnly from '../utils/clientOnly';
import Box from '@/components/Box';
import Squiggle from '@/components/etc/Squiggle';
import GalleryContentful from '@/components/Gallery/GalleryContentful';
import Glass from '@/components/Gallery/GalleryGlass';
import GalleryWrapper from '@/components/Gallery/GalleryWrapper';
import PageList from '@/components/Navigation/PageList';
import Text from '@/components/Text';

// import Thoughts from '@/components/joy/thoughts';

const mdComponents = {
  // primitives
  Box: (props: any) => <Box {...props} />,

  // text
  bold: (props: any) => <Text kind="strong" {...props} />,
  italic: (props: any) => <Text kind="em" {...props} />,
  p: (props: any) => <Text as="p" kind="p" {...props} />,
  P: (props: any) => <Text as="p" kind="p" {...props} />,
  h1: (props: any) => <Text as="h1" kind="h1" {...props} />,
  H1: (props: any) => <Text as="h1" kind="h1" {...props} />,
  h2: (props: any) => <Text as="h2" kind="h2" {...props} />,
  H2: (props: any) => <Text as="h2" kind="h2" {...props} />,
  h3: (props: any) => <Text as="h3" kind="h3" {...props} />,
  H3: (props: any) => <Text as="h3" kind="h3" {...props} />,
  h4: (props: any) => <Text as="h4" kind="h4" {...props} />,
  H4: (props: any) => <Text as="h4" kind="h4" {...props} />,
  h5: (props: any) => <Text as="h5" kind="h5" {...props} />,
  H5: (props: any) => <Text as="h5" kind="h5" {...props} />,
  h6: (props: any) => <Text as="h6" kind="h6" {...props} />,
  H6: (props: any) => <Text as="h6" kind="h6" {...props} />,
  small: (props: any) => <Text as="small" kind="small" {...props} />,
  span: (props: any) => <Text as="span" kind="span" {...props} />,
  pre: (props: any) => <Text as="pre" kind="pre" {...props} />,
  code: (props: any) => <Text as="code" kind="code" {...props} />,
  Code: (props: any) => <Text as="code" kind="code" {...props} />,
  Link: (props: any) => (
    <Link {...props} passHref={true}>
      <a>{props.children}</a>
    </Link>
  ),
  Anchor: (props: any) => (
    <Link {...props} passHref={true}>
      <a>{props.children}</a>
    </Link>
  ),
  Mono: (props: any) => <Text as="span" kind="mono" {...props} />,
  ul: (props: any) => <Text as="ul" kind="ul" {...props} />,
  ol: (props: any) => <Text as="ol" kind="ol" {...props} />,
  li: (props: any) => <Text as="li" kind="li" {...props} />,

  // galleries
  Gallery: (props: any) => <GalleryContentful {...props} />,
  Glass: (props: any) => <Glass {...props} />,
  GalleryWrapper: (props: any) => <GalleryWrapper {...props} />,
  GalleryGrid: (props: any) => <GalleryWrapper {...props} />,

  // etc
  //   Thoughts: (props: any) => <Thoughts {...props} />,
  PageList: (props: any) => <PageList {...props} />,
  Sparkle: (props: any) => <Text as="span" kind="span" {...props} />,
  Squiggle: (props: any) => <Squiggle {...props} />,
  Vimeo: (props: any) => (
    <Vimeo
      responsive
      autoplay={true}
      muted={true}
      loop={true}
      autopause={false}
      showTitle={false}
      showPortrait={false}
      showByline={false}
      {...props}
    />
  ),
  Tweet: (props: any) => <Tweet {...props} />,
};

const MDX = ({ children }: any) => (
  <MDXProvider components={mdComponents}>{children}</MDXProvider>
);

export default MDX;
