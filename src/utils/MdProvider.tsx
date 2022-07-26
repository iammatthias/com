import Text from '@/components/text';

const mdComponents = {
  p: (props: any) => <Text as="p" kind="p" mono={true} {...props} />,

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
  h1: (props: any) => <Text as="h1" kind="h1" {...props} mono={true} />,
  h2: (props: any) => <Text as="h2" kind="h2" {...props} mono={true} />,
  h3: (props: any) => <Text as="h3" kind="h3" {...props} mono={true} />,
  h4: (props: any) => <Text as="h4" kind="h4" {...props} mono={true} />,
  h5: (props: any) => <Text as="h5" kind="h5" {...props} mono={true} />,
  h6: (props: any) => <Text as="h6" kind="h6" {...props} mono={true} />,
};

export default mdComponents;
