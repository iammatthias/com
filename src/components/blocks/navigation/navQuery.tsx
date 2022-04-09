import { useQuery, gql } from '@apollo/client';
import client from '@/lib/apolloClient';
import { isDev } from '@/utils/isDev';
import { styled } from '@stitches/react';
import Link from 'next/link';

const QUERY = gql`
  query ($preview: Boolean, $type: String, $limit: Int) {
    pageCollection(
      preview: $preview
      where: { pageType: $type }
      limit: $limit
      order: publishDate_DESC
    ) {
      items {
        title
        pageType
        publishDate
        slug
      }
    }
  }
`;

export default function NavQuery(props: any) {
  const itemStyles = {
    margin: `0`,
    padding: `0`,
    outline: `none`,
    userSelect: `none`,
    fontWeight: 500,
    lineHeight: 1,
    borderRadius: 4,
    fontSize: 15,
    color: `$colors$primary`,
    $$shadowColor: `$colors$primary`,
    '&:focus': { position: `relative` },
  };

  const StyledLink = styled(`a`, {
    ...itemStyles,
    display: `block`,
    textDecoration: `none`,
    lineHeight: 1,
  });

  const ListItem = styled(`div`);

  const LinkTitle = styled(`p`, {
    fontWeight: `Bold`,
    lineHeight: 1.2,
    margin: `0 0 8px`,
    fontSize: `15px`,
    wordWrap: `break-word`,
  });

  const LinkText = styled(`p`, {
    fontSize: `12px`,
    lineHeight: 1.4,
  });

  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      type: props.type,
      limit: parseInt(props.limit),
      preview: isDev,
    },
    client,
  });

  if (loading) {
    return null;
  }

  if (error) {
    console.error(error);
    return null;
  }

  const pageList = data.pageCollection.items;

  return pageList.map((page: any, index: number) => (
    <ListItem key={index}>
      <Link href={`/${page.slug}`} passHref>
        <StyledLink>
          <LinkTitle>{page.title}</LinkTitle>
          <LinkText>
            Published:{` `}
            {new Date(
              page.publishDate.replace(/-/g, `/`).replace(/T.+/, ``),
            ).toLocaleDateString(`en-us`)}
          </LinkText>
        </StyledLink>
      </Link>
    </ListItem>
  ));
}
