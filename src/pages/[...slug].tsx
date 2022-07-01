// Language: typescript
// pages/[...slug].tsx

import { gql } from '@apollo/client';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';

import Layout from '@/components/Layout';
import { contentfulClient } from '@/utils/apolloProvider';
import { isDev } from '@/utils/isDev';

export default function Page({ mdx }: any) {
  return (
    <Layout as="main" layout="pageContent">
      <MDXRemote {...mdx} />
    </Layout>
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
    fallback: false,
  };
}

//////////////// PAGE CONTENT /////////////////////

// We use getStaticProps to get the content at build time
export async function getStaticProps({ params }: any) {
  // params contains the page `slug`.
  // We define our query here
  const { data } = await contentfulClient.query({
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
          }
        }
      }
    `,
    variables: {
      slug: params.slug.join(`/`),
      preview: isDev,
    },
  });

  const source = data.pageCollection.items[0].body;
  const mdxSource = await serialize(source);
  const pageType = data.pageCollection.items[0].pageType;
  const pageTitle = data.pageCollection.items[0].title;
  const publishDate = new Date(
    data.pageCollection.items[0].publishDate
      .replace(/-/g, `/`)
      .replace(/T.+/, ``),
  ).toLocaleDateString(`en-us`);
  const slug = data.pageCollection.items[0].slug;

  // We return the result of the query as props to pass them above
  return {
    props: {
      pageType: pageType,
      pageTitle: `IAM | ${pageTitle}`,
      publishDate: publishDate,
      mdx: mdxSource,
      slug: slug,
    },
  };
}
