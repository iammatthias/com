import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export const arweaveQL = new ApolloClient({
  uri: "https://arweave.net/graphql",
  cache: new InMemoryCache(),
});
