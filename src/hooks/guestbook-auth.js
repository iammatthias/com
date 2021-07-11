import { useMoralis } from 'react-moralis';
// import { navigate } from 'gatsby-link';

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
          },
        });
        // navigate('/guestbook');
      } catch (e) {
        console.error(e.message, e);
      }
    },
  };
}
