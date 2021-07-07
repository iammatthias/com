/** @jsx jsx */
import { jsx } from 'theme-ui';

import Layout from '../components/layout';

import { useMoralis } from 'react-moralis';

// markup
const IndexPage = () => {
  const { authenticate, isAuthenticated, user } = useMoralis();

  return (
    <Layout>
      <p sx={{ color: 'text' }}>bruh</p>
      <br />
      {!isAuthenticated ? (
        <button onClick={() => authenticate({ provider: 'walletconnect' })}>
          Authenticate
        </button>
      ) : (
        <span>Welcome {user.get('username')}</span>
      )}
    </Layout>
  );
};

export default IndexPage;
