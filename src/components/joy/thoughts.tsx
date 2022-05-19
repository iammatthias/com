import { useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { githubClient } from '@/lib/apolloClient';

import { Text } from '../primitives/text';
import { Box } from '../primitives/box';
import { Button } from '../primitives/button';

import matter from 'gray-matter';
import Link from 'next/link';

import { Link2Icon } from '@radix-ui/react-icons';

import copy from 'copy-data-to-clipboard';

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
      <Text as="h3">Thoughts</Text>
      <Box
        css={{
          margin: `0 0 16px`,
        }}
      >
        <Text>
          <Text as="code">Thoughts</Text> are like tweets—digestible bits of
          short form content.
        </Text>
        <Text>
          Written with markdown, managed with{` `}
          <Link href="https://obsidian.md">Obsidian</Link>, published using
          GitHub.
        </Text>
      </Box>
      <Box css={{ border: `1px solid`, borderColor: `$text`, padding: `16px` }}>
        {data &&
          data.repository.object.entries.map(
            ({ index, object }: any) =>
              matter(object.text).data.published && (
                <Box
                  key={index}
                  css={{
                    margin: `0 0 16px`,
                    '&:last-child': { position: `relative`, margin: `0` },
                  }}
                  id={matter(object.text).data.title}
                >
                  <Text as="h6">{matter(object.text).data.title}</Text>
                  <Text>{matter(object.text).content}</Text>

                  <Button
                    css={{
                      lineHeight: `15px`,
                    }}
                    onClick={() =>
                      copy(
                        `https://iammatthias.com/#${
                          matter(object.text).data.title
                        }`,
                      )
                    }
                  >
                    <Link2Icon />
                  </Button>
                </Box>
              ),
          )}
      </Box>
    </Box>
  );
}
