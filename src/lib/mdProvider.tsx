const mdComponents = {
  p: (props: any) => <p {...props} style={{ fontSize: `14px` }} />,
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
  h1: (props: any) => (
    <h1 {...props} className="mono" style={{ fontWeight: `bold` }} />
  ),
  h2: (props: any) => (
    <h2 {...props} className="mono" style={{ fontWeight: `bold` }} />
  ),
  h3: (props: any) => (
    <h3 {...props} className="mono" style={{ fontWeight: `bold` }} />
  ),
  h4: (props: any) => (
    <h4 {...props} className="mono" style={{ fontWeight: `bold` }} />
  ),
  h5: (props: any) => (
    <h5 {...props} className="mono" style={{ fontWeight: `bold` }} />
  ),
  h6: (props: any) => (
    <h6 {...props} className="mono" style={{ fontWeight: `bold` }} />
  ),
  figure: (props: any) => <figure {...props} style={{ fontSize: `14px` }} />,
};

export default mdComponents;
