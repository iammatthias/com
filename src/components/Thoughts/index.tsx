import { gql, useQuery } from '@apollo/client';
import { Link2Icon } from '@radix-ui/react-icons';
import copy from 'copy-data-to-clipboard';
import matter from 'gray-matter';
import Link from 'next/link';
import { Remark } from 'react-remark';
import rehypeRaw from 'rehype-raw';

import Box from '@/components/Box';
import Button from '@/components/Button';
import Text from '@/components/Text';
import { githubClient } from '@/utils/apolloProvider';
import { isDev } from '@/utils/isDev';
import mdComponents from '@/utils/MdProvider';

import { thoughtRecipe } from './Thoughts.css';

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
                  <Text as="p" kind="p">
                    <Text as="small" kind="small">
                      <Text as="strong" kind="strong">
                        {matter(entry.object.text).data.title}
                      </Text>
                    </Text>
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
                  kind="thought"
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
