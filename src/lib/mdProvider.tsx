import { Text } from '@/components/primitives/text';
const mdComponents = {
  // p: (props: any) => <p {...props} style={{ fontSize: `14px` }} />,
  p: (props: any) => (
    <Text as="small" {...props} style={{ display: `block` }} />
  ),

  strong: (props: any) => <strong {...props} />,
  em: (props: any) => <em {...props} />,
  img: (props: any) => (
    <img
      src={
        `https://cdn.statically.io/gh/iammatthias/Thoughts/main/Assets/` +
        props.src
      }
      style={{ width: `50%` }}
    />
  ),
  h1: (props: any) => <Text as="h1" {...props} />,
  h2: (props: any) => <Text as="h2" {...props} />,
  h3: (props: any) => <Text as="h3" {...props} />,
  h4: (props: any) => <Text as="h4" {...props} />,
  h5: (props: any) => <Text as="h5" {...props} />,
  h6: (props: any) => <Text as="h6" {...props} />,
  figure: (props: any) => <figure {...props} style={{ fontSize: `14px` }} />,
};

export default mdComponents;
