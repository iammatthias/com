export async function getOnchainData(address: string) {
  const response = await fetch(`https://api.zora.co/graphql`, {
    method: `POST`,
    headers: {
      "Content-Type": `application/json`,
    },
    body: JSON.stringify({
      query: `
      query Onchain($address: [String!]!) {
        collections(
          where: {collectionAddresses: $address}
          networks: {network: ZORA, chain: ZORA_MAINNET}
        ) {
          nodes {
            tokenStandard
            name
            description
          }
        }
        tokens(
          networks: {network: ZORA, chain: ZORA_MAINNET}
          where: {collectionAddresses: $address}
          sort: {sortKey: MINTED, sortDirection: DESC}
          pagination: {limit: 100}
        ) {
          nodes {
            token {
              name
              description
              tokenId
              metadata
            }
          }
        }
      }
            `,
      variables: {
        address: address,
      },
    }),
    next: {
      revalidate: 1 * 30,
    },
  }).then((res) => res.json());

  const data = await response;
  return data;
}
