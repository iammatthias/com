import { navigate } from 'gatsby-link';
import { useMoralis } from './use-moralis';

export function useAuth() {
  const { Moralis } = useMoralis();
  return {
    login: async () => {
      try {
        await Moralis?.Web3.authenticate();
        try {
          await Moralis?.User.logOut();
          navigate('/guestbook');
        } catch (e) {
          console.error(e.message, e);
        }
      } catch (e) {
        console.error(e.message, e);
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
