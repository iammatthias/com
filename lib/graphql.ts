import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// arweave client
export const arweaveQL = new ApolloClient({
  uri: "https://arweave.net/graphql",
  cache: new InMemoryCache(),
});

// github client
const github = createHttpLink({
  uri: `https://api.github.com/graphql`,
});

const githubAuth = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = process.env.NEXT_PUBLIC_GITHUB;

  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      Authorization: `Bearer ${token}`,
    },
  };
});

export const githubQL = new ApolloClient({
  ssrMode: true,
  link: githubAuth.concat(github),
  cache: new InMemoryCache(),
});
