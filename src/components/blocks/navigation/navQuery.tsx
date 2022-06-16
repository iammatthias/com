import { useQuery, gql } from '@apollo/client';
import { contentfulClient } from '@/lib/apolloClient';
import { isDev } from '@/utils/isDev';

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
  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      type: props.type,
      limit: parseInt(props.limit),
      preview: isDev,
    },
    client: contentfulClient,
  });

  if (loading) {
    return null;
  }

  if (error) {
    console.error(error);
    return null;
  }

  const pageList = data.pageCollection.items;

  // return pageList.map((page: any, index: number) => (
  //   <ListItem key={index}>
  //     <StyledLink href={`/${page.slug}`} passHref>
  //       <a>
  //         <LinkTitle>{page.title}</LinkTitle>
  //         <LinkText>
  //           Published:{` `}
  //           {new Date(
  //             page.publishDate.replace(/-/g, `/`).replace(/T.+/, ``),
  //           ).toLocaleDateString(`en-us`)}
  //         </LinkText>
  //       </a>
  //     </StyledLink>
  //   </ListItem>
  // ));

  return pageList;
}
