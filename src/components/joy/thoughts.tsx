import { useQuery, gql } from '@apollo/client';
import { githubClient } from '@/lib/apolloClient';
import { Remark } from 'react-remark';

import matter from 'gray-matter';

import Text from '../primitives/text';
import { Box } from '../primitives/box';
import { Button } from '../primitives/button';

import Link from 'next/link';

import { Link2Icon } from '@radix-ui/react-icons';

import copy from 'copy-data-to-clipboard';

import { isDev } from '@/utils/isDev';

import rehypeRaw from 'rehype-raw';

import mdComponents from '@/lib/mdProvider';

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
      <Box>
        <Text as="h3">Thoughts</Text>
        <Box
          css={{
            margin: `0 0 16px`,
          }}
        >
          <Text>
            <Text as="code">Thoughts</Text> are like tweets—digestible bits of
            short form content that do not matter.
          </Text>
          <Text>
            Written with markdown, managed with{` `}
            <Link href="https://obsidian.md">Obsidian</Link>, published using
            GitHub.
          </Text>
        </Box>
        <Box
          css={{ border: `1px solid`, borderColor: `$text`, padding: `16px` }}
        >
          {sortedEntries.map(
            (entry: any) =>
              (isDev || matter(entry.object.text).data.published) && (
                <Box
                  key={entry.name}
                  className="mono"
                  css={{
                    margin: `0 0 16px`,
                    padding: `0 0 16px`,
                    display: `flex`,
                    gap: `16px`,
                    alignItems: `end`,
                    justifyContent: `space-between`,
                    borderBottom: `1px solid`,
                    '&:last-child': {
                      position: `relative`,
                      margin: `0`,
                      padding: `0`,
                      border: `none`,
                    },
                  }}
                  id={matter(entry.object.text).data.title}
                >
                  <Box>
                    <Text as="small" css={{ fontWeight: `bold` }}>
                      {matter(entry.object.text).data.title}
                    </Text>

                    <Remark
                      remarkToRehypeOptions={{ allowDangerousHtml: true }}
                      rehypePlugins={[rehypeRaw] as any}
                      rehypeReactOptions={{
                        components: mdComponents,
                      }}
                    >
                      {matter(entry.object.text).content}
                    </Remark>
                  </Box>
                  <Button
                    css={{
                      lineHeight: `15px`,
                      height: `fit-content`,
                      padding: `0`,
                    }}
                    onClick={() =>
                      copy(
                        `https://iammatthias.com/#${
                          matter(entry.object.text).data.title
                        }`,
                      )
                    }
                  >
                    <Box
                      css={{
                        height: `30px`,
                        width: `30px`,
                        display: `flex`,
                        alignItems: `center`,
                        justifyContent: `center`,
                      }}
                    >
                      <Link2Icon />
                    </Box>
                  </Button>
                </Box>
              ),
          )}
        </Box>
      </Box>
    )
  );
}
