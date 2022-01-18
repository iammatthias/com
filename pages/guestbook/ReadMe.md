# The Guest Book

## What

Remember `Guestbooks` in the early days of the internet? A small piece of interactivity that allowed end users to leave their mark on a piece of the web.

Same concept, now in Web3.

An end user connects using the Wallet of their choice (using something like MetaMask or a WalletConnect enabled app like Rainbow), writes a custom message, and signs it. They they have the option of paying a nominal gas fee to record their message to the smart contract, receiving an NFT with their message in return. The contract is based on [gwei-slim-erc721](https://github.com/iainnash/gwei-slim-erc721), and re-implements the on-chain SVG generation from [@dhof's](https://twitter.com/dhof) [Loot contract](https://etherscan.io/address/0xff9c1b15b16263c61d017ee9f65c50e4ae0113d7).

Built using [NextJS](https://nextjs.org) and [wagmi](https://wagmi-zoo.vercel.app)
