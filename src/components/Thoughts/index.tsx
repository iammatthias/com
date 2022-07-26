// Thoughts
// Language: typescript

// Loads and renders the `Thoughts` content  using GraphQL.
// Thoughts are written in markdown, managed using Obsidian, and stored on GitHub.

import { gql, useQuery } from '@apollo/client';
import { Link2Icon } from '@radix-ui/react-icons';
import copy from 'copy-data-to-clipboard';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';

import Box from '@/components/Box';
import Button from '@/components/button';
import Text from '@/components/text';
import { githubClient } from '@/utils/apolloProvider';
import { isDev } from '@/utils/isDev';
import MD from '@/utils/MDprovider';

import { thoughtRecipe } from './thoughts.css';

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
  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      owner: `iammatthias`,
      name: `Thoughts`,
    },
    client: githubClient,
  });

  if (loading)
    return (
      <Box>
        <Text as="p">Loading...</Text>
      </Box>
    );
  if (error)
    return (
      <Box>
        <Text>Error!</Text>
      </Box>
    );

  const { entries } = data.repository.object;

  const sortedEntries = entries.slice().sort().reverse();

  return (
    sortedEntries && (
      <Box className={thoughtRecipe({ thought: `wrapper` })}>
        {sortedEntries.map(
          (entry: any) =>
            (isDev || matter(entry.object.text).data.published) && (
              <Box
                key={entry.name}
                className={thoughtRecipe({ thought: `content` })}
                id={matter(entry.object.text).data.title}
              >
                <Box className={thoughtRecipe({ thought: `contentGrid` })}>
                  <Text as="p" kind="p" bold={true}>
                    {matter(entry.object.text).data.title}
                  </Text>

                  <ReactMarkdown components={MD}>
                    {matter(entry.object.text).content}
                  </ReactMarkdown>
                </Box>
                <Button
                  kind="primary"
                  onClick={() =>
                    copy(
                      `https://iammatthias.com/#${
                        matter(entry.object.text).data.title
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
    )
  );
}
