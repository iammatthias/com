import { useQuery, gql } from '@apollo/client';
import { githubClient } from '@/lib/apolloClient';

import { Text } from '../primitives/text';
import { Box } from '../primitives/box';

import matter from 'gray-matter';
import Link from 'next/link';

const QUERY = gql`
  query ($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      object(expression: "HEAD:Thoughts/") {
        ... on Tree {
          entries {
            name
            object {
              ... on Blob {
                text
              }
            }
          }
        }
      }
    }
  }
`;

export default function Thoughts() {
  // data
  const { data } = useQuery(QUERY, {
    variables: {
      owner: `iammatthias`,
      name: `Thoughts`,
    },
    client: githubClient,
  });

  return (
    <Box>
      <Text as="h3" css={{ textAlign: `center` }}>
        Thoughts
      </Text>
      <Box
        css={{
          margin: `0 0 16px`,
          textAlign: `center`,
        }}
      >
        <Text>
          <Text as="code">Thoughts</Text> are like tweets—short, digestible bits
          of short form content.
        </Text>
        <Text>
          Written with markdown using{` `}
          <Link href="https://obsidian.md">Obsidian</Link>, published using
          GitHub.
        </Text>
      </Box>
      <Box css={{ border: `1px solid`, borderColor: `$text`, padding: `16px` }}>
        {data &&
          data.repository.object.entries.map(({ index, object }: any) => (
            <Box key={index} css={{ margin: `0 0 16px` }}>
              <Text as="h6">{matter(object.text).data.title}</Text>
              <Text>{matter(object.text).content}</Text>
            </Box>
          ))}
      </Box>
    </Box>
  );
}
