import { navigate } from 'gatsby-link';
import { useMoralis } from './use-moralis';

export function useAuth() {
  const { Moralis } = useMoralis();
  return {
    login: async () => {
      try {
        await Moralis?.Web3.authenticate();
        navigate('/guestbook');
      } catch (e) {
        console.error(e.message, e);
      }
    },

    logout: async () => {
      try {
        await Moralis?.User.logOut();
        navigate('/guestbook');
      } catch (e) {
        console.error(e.message, e);
      }
    },

    // currentUser: () => {
    //   return Moralis?.User.current();
    // },

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
