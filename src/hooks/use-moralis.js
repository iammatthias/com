let Moralis;
export function useMoralis() {
  if (Moralis) return { Moralis };
  // Moralis Initialization
  if (typeof window !== `undefined`) {
    Moralis = require('moralis');
    Moralis.initialize(
      process.env.MORALIS_APPLICATION_ID,
      process.env.MORALIS_MASTER_KEY
    );
    Moralis.serverURL = process.env.MORALIS_SERVER_ID;
  }
  return { Moralis };
}
