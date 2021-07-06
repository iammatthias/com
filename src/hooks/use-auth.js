import { navigate } from 'gatsby-link';
import { useMoralis } from './use-moralis';
import WalletConnectProvider from '@walletconnect/web3-provider';

export function useAuth() {
  const { Moralis } = useMoralis();
  const provider = new WalletConnectProvider({
    // infuraId: process.env.GATSBY_INFURA,
    rpc: {
      1: process.env.GATSBY_MORALIS_NODE,
      4: process.env.GATSBY_MORALIS_NODE_RINKEBY,
    },
  });

  return {
    login: async (resolve) => {
      await provider.enable();
      const web3 = await Moralis.Web3.enable(provider);
      resolve(web3);
      let user = Moralis.User.current();

      if (!user) {
        try {
          user = await Moralis.Web3.authenticate({
            provider: web3,
          }).then(function (user) {
            console.log('logged in user:', user).then(navigate('/guestbook'));
          });
        } catch (e) {
          console.error(e.message, e);
        }
      }
    },

    guestbookLog: async () => {
      try {
        const guests = await Moralis.Cloud.run('getUserList', {});
        return guests;
      } catch (e) {
        console.error(e.message, e);
      }
    },
  };
}
