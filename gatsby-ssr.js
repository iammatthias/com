const React = require('react');
const { MoralisProvider } = require('react-moralis');

exports.wrapRootElement = ({ element }) => {
  return (
    <MoralisProvider
      appId={process.env.GATSBY_MORALIS_APPLICATION_ID}
      serverUrl={process.env.GATSBY_MORALIS_SERVER_ID}
    >
      {element}
    </MoralisProvider>
  );
};
