import { MDXProvider } from '@mdx-js/react';
import ClientOnly from '../utils/clientOnly';

// primitives
import { Box } from '@/components/primitives/box';

// text
import { Text } from '@/components/primitives/text';
import Link from '@/components/primitives/link';

// gallery
import GalleryQuery from '@/components/blocks/gallery/galleryQuery';
import GalleryGrid from '@/components/blocks/gallery/galleryGrid';
import Glass from '@/components/blocks/gallery/galleryGlass';

// etc
import Sparkles from '@/components/joy/sparkle';
import Mono from '@/components/joy/mono';
import Squiggle from '@/components/joy/squiggle';
import Spicy from '@/components/joy/spicy';
import Vimeo from '@u-wave/react-vimeo';

const mdComponents = {
  // primitives
  Box: (props: any) => <Box {...props} />,

  // text
  p: (props: any) => <Text as="p" {...props} />,
  P: (props: any) => <Text as="p" {...props} />,
  h1: (props: any) => <Text as="h1" {...props} />,
  H1: (props: any) => <Text as="h1" {...props} />,
  h2: (props: any) => <Text as="h2" {...props} />,
  H2: (props: any) => <Text as="h2" {...props} />,
  h3: (props: any) => <Text as="h3" {...props} />,
  H3: (props: any) => <Text as="h3" {...props} />,
  h4: (props: any) => <Text as="h4" {...props} />,
  H4: (props: any) => <Text as="h4" {...props} />,
  h5: (props: any) => <Text as="h5" {...props} />,
  H5: (props: any) => <Text as="h5" {...props} />,
  h6: (props: any) => <Text as="h6" {...props} />,
  H6: (props: any) => <Text as="h6" {...props} />,
  small: (props: any) => <Text as="small" {...props} />,
  span: (props: any) => <Text as="small" {...props} />,
  pre: (props: any) => <Text as="pre" {...props} />,
  code: (props: any) => <Text as="code" {...props} />,
  Code: (props: any) => <Text as="code" {...props} />,
  Link: (props: any) => <Link {...props} />,
  Anchor: (props: any) => <Link {...props} />,

  // galleries
  Gallery: (props: any) => <GalleryQuery {...props} />,
  Glass: (props: any) => <Glass {...props} />,
  GalleryGrid: (props: any) => <GalleryGrid {...props} />,

  // etc
  Sparkle: (props: any) => (
    <ClientOnly>
      <Sparkles {...props} />
    </ClientOnly>
  ),
  Mono: (props: any) => <Mono {...props} />,
  Squiggle: (props: any) => <Squiggle {...props} />,
  Spicy: (props: any) => <Spicy {...props} />,
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
};

const MDX = ({ children }: any) => (
  <MDXProvider components={mdComponents}>{children}</MDXProvider>
);
export default MDX;
