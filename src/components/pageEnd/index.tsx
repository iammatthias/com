import { gql, useQuery } from '@apollo/client';
import Link from 'next/link';

import Box from '@/components/box';
import Button from '@/components/button';
import Squiggle from '@/components/squiggle';
import { contentfulClient } from '@/utils/apolloProvider';
import { isDev } from '@/utils/isDev';
import { pageEnd } from './pageEnd.css';

// page footer

const QUERY = gql`
  query ($preview: Boolean, $pageType: String) {
    pagination: pageCollection(
      preview: $preview
      order: publishDate_DESC
      where: { pageType: $pageType }
    ) {
      total
      items {
        slug
      }
    }
  }
`;

export default function PageEnd({ ...props }) {
  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      pageType: props.pagetype,
      slug: props.slug,
      preview: isDev,
    },
    client: contentfulClient,
  });

  if (loading) {
    return <>loading...</>;
  }

  if (error) {
    console.error(error);
    return null;
  }

  const paginationTotal = data.pagination.total;
  const paginationIndex = data.pagination.items
    .map((item: any) => item.slug)
    .indexOf(props.slug);

  const prevIndex =
    paginationIndex + 1 == paginationTotal
      ? paginationIndex
      : paginationIndex + 1;
  const nextIndex = paginationIndex - 1 == -1 ? 0 : paginationIndex - 1;

  const paginationPrev = data.pagination.items[prevIndex];
  const paginationNext = data.pagination.items[nextIndex];

  const prevSlug = paginationPrev ? paginationPrev.slug : `/`;
  const nextSlug = paginationNext ? paginationNext.slug : `/`;

  return (
    <Box className={`${pageEnd}`}>
      <Squiggle />
      <Box>
        <Link href={nextSlug}>
          <a>
            <Button kind="primary">←</Button>
          </a>
        </Link>
        <span>
          &nbsp;&nbsp;&nbsp;{paginationIndex + 1} /{` `}
          {paginationTotal}
          &nbsp;&nbsp;&nbsp;
        </span>
        <Link href={prevSlug}>
          <a>
            <Button kind="primary">→</Button>
          </a>
        </Link>
      </Box>
    </Box>
  );
}
