import { gql } from '@apollo/client';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';

import { contentfulClient } from '@/utils/ApolloProvider';
import dateFormat from '@/utils/DateFormat';
import { isDev } from '@/utils/IsDev';

type Props = {
  mdx: any;
  pageName: string;
  pageType: string;
  publishDate: string;
  updateDate: string;
  slug: string;
};

export default function Page({
  mdx,
  pageType,
  pageName,
  publishDate,
  updateDate,
  slug,
}: Props) {
  return (
    <>
      <MDXRemote {...mdx} />
    </>
  );
}

//////////////// PAGE PATHS /////////////////////

// We use getStaticPaths to get all the slugs at build time
export async function getStaticPaths() {
  // We define our query here
  const { data } = await contentfulClient.query({
    query: gql`
      query SlugsIndex($preview: Boolean) {
        pageCollection(preview: $preview, where: { slug_not: "home" }) {
          items {
            slug
          }
        }
      }
    `,
    variables: {
      preview: isDev,
    },
  });
  // Get the paths we want to pre-render based on posts
  const slugs = data.pageCollection.items;

  // Map them under the accepted format for the return part of getStaticPaths
  const paths = slugs.map((page: any) => ({
    params: {
      slug: page.slug.includes(`/`) ? page.slug.split(`/`) : [page.slug],
      page: page++,
    },
  }));

  // We`ll pre-render only these paths at build time.
  // { fallback: false } means other routes should 404.
  return {
    paths,
    fallback: `blocking`,
  };
}

//////////////// PAGE CONTENT /////////////////////

// We use getStaticProps to get the content at build time
export async function getStaticProps({ params }: any) {
  // params contains the page `slug`.
  // We define our query here
  const { data, loading, error } = await contentfulClient.query({
    query: gql`
      query ($preview: Boolean, $slug: String) {
        pageCollection(
          preview: $preview
          limit: 1
          where: { slug: $slug, slug_not: "home" }
        ) {
          items {
            title
            publishDate
            body
            slug
            pageType
            sys {
              publishedAt
              firstPublishedAt
            }
          }
        }
      }
    `,
    variables: {
      slug: params.slug.join(`/`),
      preview: isDev,
    },
  });

  if (loading) {
    return null;
  }

  if (error) {
    console.error(error);
    return { props: { error } };
  }

  const source = data.pageCollection.items[0].body;
  const mdxSource = await serialize(source);
  const pageType = data.pageCollection.items[0].pageType;
  const pageTitle = data.pageCollection.items[0].title;
  const publishDate = data.pageCollection.items[0].publishDate
    ? dateFormat(data.pageCollection.items[0].publishDate)
    : dateFormat(data.pageCollection.items[0].sys.firstPublishedAt);
  const updateDate = data.pageCollection.items[0].publishDate
    ? dateFormat(data.pageCollection.items[0].publishDate)
    : dateFormat(data.pageCollection.items[0].sys.publishedAt);
  const slug = data.pageCollection.items[0].slug;

  // We return the result of the query as props to pass them above
  return {
    props: {
      pageType: pageType,
      pageTitle: `IAM | ${pageTitle}`,
      pageName: pageTitle,
      publishDate: publishDate,
      updateDate: updateDate,
      mdx: mdxSource,
      slug: slug,
    },
    revalidate: 10,
  };
}
