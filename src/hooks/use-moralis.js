let Moralis;
export function useMoralis() {
  if (Moralis) return { Moralis };
  // Moralis Initialization
  if (typeof window !== `undefined`) {
    Moralis = require('moralis');
    Moralis.initialize('F0CBlQWMu3lUAj5BL8OdXQeOF7uDEmOak7pkUKJG');
    Moralis.serverURL = 'https://1bmita1upxl9.moralis.io:2053/server';
  }
  return { Moralis };
}
