// apollo client

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  HttpLink,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const contentful = new HttpLink({
  uri: `https://graphql.contentful.com/content/v1/spaces/${process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID}/?access_token=${process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN}`,
});

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

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      ),
    );

  if (networkError) console.log(`[Network error]: ${networkError}`);
});

const contentfulClient = new ApolloClient({
  ssrMode: true,
  link: from([errorLink, contentful]),
  cache: new InMemoryCache(),
  credentials: `same-origin`,
});

const githubClient = new ApolloClient({
  ssrMode: true,
  link: githubAuth.concat(github),
  cache: new InMemoryCache(),
});

export { contentfulClient, githubClient };
