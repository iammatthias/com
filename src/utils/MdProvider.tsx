import Text from '@/components/Text';

const mdComponents = {
  // p: (props: any) => <p {...props} style={{ fontSize: `14px` }} />,
  p: (props: any) => (
    <Text as="p" kind="p">
      <Text as="small" kind="small" {...props} />
    </Text>
  ),

  strong: (props: any) => <strong {...props} />,
  em: (props: any) => <em {...props} />,
  img: (props: any) => (
    <img
      src={
        `https://cdn.statically.io/gh/iammatthias/Thoughts/main/Assets/` +
        props.src
      }
      alt=""
      style={{ width: `calc(100% - 16px)` }}
    />
  ),
  h1: (props: any) => <Text as="h1" kind="h1" {...props} />,
  h2: (props: any) => <Text as="h2" kind="h2" {...props} />,
  h3: (props: any) => <Text as="h3" kind="h3" {...props} />,
  h4: (props: any) => <Text as="h4" kind="h4" {...props} />,
  h5: (props: any) => <Text as="h5" kind="h5" {...props} />,
  h6: (props: any) => <Text as="h6" kind="h6" {...props} />,
};

export default mdComponents;
