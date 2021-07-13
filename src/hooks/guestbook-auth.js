import { useMoralis } from 'react-moralis';
// import { navigate } from 'gatsby-link';
import { track } from '../hooks/use-segment';

export function GuestbookAuth() {
  const { authenticate, logout, Moralis } = useMoralis();

  return {
    login: async () => {
      Moralis.Web3.getSigningData = () =>
        'Sign the web3 guestbook on iammatthias.com';
      try {
        await authenticate({
          provider: 'walletconnect',
          onSuccess: () => {
            window.location.reload();
            logout();
            track('Guestbook Signed');
          },
        });
        // navigate('/guestbook');
      } catch (e) {
        console.error(e.message, e);
      }
    },
  };
}
