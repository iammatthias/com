export function useMoralis() {
  // Moralis Initialization
  let Moralis;
  if (typeof window !== `undefined`) {
    Moralis = require('moralis');
    Moralis.initialize(process.env.MORALIS_APPLICATION_ID);
    Moralis.serverURL = process.env.MORALIS_SERVER_ID;
  }
  return { Moralis };
}
