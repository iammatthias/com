import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export const mirrorQL = new ApolloClient({
  link: new HttpLink({ uri: "https://mirror-api.com/graphql", fetch, headers: { origin: "https://mirror.xyz" } }),
  cache: new InMemoryCache(),
});

export const arweaveQL = new ApolloClient({
  uri: "https://arweave.net/graphql",
  cache: new InMemoryCache(),
});
