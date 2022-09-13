import { gql, useQuery } from '@apollo/client';

import { contentfulClient } from '@/utils/apolloProvider';
import { isDev } from '@/utils/isDev';

const QUERY = gql`
  query ($preview: Boolean, $type: String, $featured: Boolean, $limit: Int) {
    pageCollection(
      preview: $preview
      where: { pageType: $type, featured: $featured }
      limit: $limit
      order: publishDate_DESC
    ) {
      items {
        title
        pageType
        publishDate
        slug
        featured
      }
    }
  }
`;

export default function PageQuery(props: any) {
  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      type: props.type,
      limit: parseInt(props.limit),
      featured: props.featured,
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

  return pageList;
}
