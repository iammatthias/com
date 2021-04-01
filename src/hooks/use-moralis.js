let Moralis;
export function useMoralis() {
  if (Moralis) return { Moralis };
  // Moralis Initialization
  if (typeof window !== `undefined`) {
    Moralis = require('moralis');
    Moralis.initialize('knjJS1n0Hf0vkWjluePnByHQKVgUNdujnbtPbMUD');
    Moralis.serverURL = 'https://memk9nntn6p4.moralis.io:2053/server';
  }
  return { Moralis };
}
