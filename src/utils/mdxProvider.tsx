import { MDXProvider } from '@mdx-js/react';
import Vimeo from '@u-wave/react-vimeo';
// import Link from 'next/link';
import Link from '@/components/link';
import { Tweet } from 'react-static-tweets';

import Box from '@/components/box';
import SubGrid from '@/components/subGrid';
import Squiggle from '@/components/squiggle';
import GalleryContentful from '@/components/gallery/galleryContentful';
import GalleryGlass from '@/components/gallery/galleryGlass';
import GalleryWrapper from '@/components/gallery/wrapper';
import PageList from '@/components/pageList';
import Text from '@/components/text';

// import Thoughts from '@/components/joy/thoughts';

const mdxComponents = {
  // primitives
  Box: (props: any) => <Box {...props} />,
  SubGrid: (props: any) => <SubGrid {...props} />,

  // text
  bold: (props: any) => <Text as="strong" bold={true} {...props} />,
  italic: (props: any) => <Text as="em" italic={true} {...props} />,
  p: (props: any) => <Text as="p" kind="p" font="body" {...props} />,
  h1: (props: any) => <Text as="h1" kind="h1" font="heading" {...props} />,
  h2: (props: any) => <Text as="h2" kind="h2" font="heading" {...props} />,
  h3: (props: any) => <Text as="h3" kind="h3" font="heading" {...props} />,
  h4: (props: any) => <Text as="h4" kind="h4" font="heading" {...props} />,
  h5: (props: any) => <Text as="h5" kind="h5" font="heading" {...props} />,
  h6: (props: any) => <Text as="h6" kind="h6" font="heading" {...props} />,
  P: (props: any) => <Text as="P" kind="p" font="body" {...props} />,
  H1: (props: any) => <Text as="h1" kind="h1" font="heading" {...props} />,
  H2: (props: any) => <Text as="h2" kind="h2" font="heading" {...props} />,
  H3: (props: any) => <Text as="h3" kind="h3" font="heading" {...props} />,
  H4: (props: any) => <Text as="h4" kind="h4" font="heading" {...props} />,
  H5: (props: any) => <Text as="h5" kind="h5" font="heading" {...props} />,
  H6: (props: any) => <Text as="h6" kind="h6" font="heading" {...props} />,
  span: (props: any) => <Text as="span" kind="span" {...props} />,
  Span: (props: any) => <Text as="span" kind="span" {...props} />,
  pre: (props: any) => (
    <Text as="pre" kind="pre" font="typewriter" {...props} />
  ),
  Pre: (props: any) => (
    <Text as="pre" kind="pre" font="typewriter" {...props} />
  ),
  code: (props: any) => (
    <Text as="code" kind="code" font="typewriter" {...props} />
  ),
  Code: (props: any) => (
    <Text as="code" kind="code" font="typewriter" {...props} />
  ),
  blockquote: (props: any) => (
    <Text as="blockquote" kind="blockquote" font="typewriter" {...props} />
  ),
  Blockquote: (props: any) => (
    <Text as="blockquote" kind="blockquote" font="typewriter" {...props} />
  ),
  Link: (props: any) => (
    <Link {...props} passHref={true}>
      {props.children}
    </Link>
  ),
  Highlight: (props: any) => <Text as="span" highlight={true} {...props} />,
  Mono: (props: any) => <Text as="span" mono={true} {...props} />,
  ul: (props: any) => <Text as="ul" kind="ul" font="typewriter" {...props} />,
  Ul: (props: any) => <Text as="ul" kind="ul" font="typewriter" {...props} />,
  ol: (props: any) => <Text as="ol" kind="ol" font="typewriter" {...props} />,
  Ol: (props: any) => <Text as="ol" kind="ol" font="typewriter" {...props} />,
  li: (props: any) => <Text as="li" kind="li" font="typewriter" {...props} />,
  Li: (props: any) => <Text as="li" kind="li" font="typewriter" {...props} />,

  // //   // galleries
  Gallery: (props: any) => <GalleryContentful {...props} />,
  Glass: (props: any) => <GalleryGlass {...props} />,
  GalleryWrapper: (props: any) => <GalleryWrapper {...props} />,
  GalleryGrid: (props: any) => <GalleryWrapper {...props} />,

  //   // etc
  //   //   Thoughts: (props: any) => <Thoughts {...props} />,
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
  <MDXProvider components={mdxComponents}>{children}</MDXProvider>
);

export default MDX;
