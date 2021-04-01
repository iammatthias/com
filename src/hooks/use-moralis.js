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
    Moralis.serverURL = 'https://1bmita1upxl9.moralis.io:2053/server';
  }
  return { Moralis };
}
