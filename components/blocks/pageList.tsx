// page list

import { useQuery, gql } from '@apollo/client'
import Link from 'next/link'
import Box from '../primitives/box'
import { isDev } from '@/lib/isDev'
import P from '../primitives/text/P'
import Small from '../primitives/text/small'
import Squiggle from '../joy/squiggle'
import Masonry from 'react-masonry-css'
import useMeasure from 'react-use-measure'

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
`

export default function PageList(props: any) {
  // container width
  // @ts-ignore
  const [ref, bounds] = useMeasure()

  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      type: props.type,
      limit: parseInt(props.limit),
      preview: isDev,
    },
  })

  if (loading) {
    return <Box>loading</Box>
  }

  if (error) {
    console.error(error)
    return null
  }

  const pageList = data.pageCollection.items

  const columns =
    bounds.width > 1536
      ? 5
      : bounds.width > 1024
      ? 4
      : bounds.width > 768
      ? 3
      : bounds.width > 512
      ? 2
      : 1

  const columnWidth = bounds.width / columns

  return (
    <Box ref={ref}>
      <Masonry
        breakpointCols={columns}
        className="my-masonry-grid"
        columnClassName="column"
      >
        {pageList.map((page: any) => (
          <Box
            key={page.slug}
            css={{
              border: '1px solid pink',
              padding: '0 16px 16px 0',
              maxWidth: 'calc(columnWidth - 32px)',
            }}
          >
            <Link href={page.slug}>
              <a
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <P css={{ fontWeight: 'bold', m: 0, mb: 1, p: 0 }}>
                  {page.title}{' '}
                </P>
                <Small css={{ fontWeight: 'normal' }}>
                  Published:{' '}
                  {new Date(
                    page.publishDate.replace(/-/g, '/').replace(/T.+/, ''),
                  ).toLocaleDateString('en-us')}
                </Small>
                <Squiggle />
              </a>
            </Link>
          </Box>
        ))}
      </Masonry>
    </Box>
  )
}
