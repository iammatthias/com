/** @jsxImportSource theme-ui */

// page list

import { useQuery, gql } from '@apollo/client'
import Link from 'next/link'
import { Box } from 'theme-ui'
import Loading from './loading'
import Squiggle from './squiggle'
import { isDev } from './isDev'

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

export default function PageList(props) {
  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      type: props.type,
      limit: parseInt(props.limit),
      preview: isDev,
    },
  })

  if (loading) {
    return (
      <Box sx={{ width: 'fit-content', margin: '0' }}>
        <Loading />
        <Squiggle />
      </Box>
    )
  }

  if (error) {
    console.error(error)
    return null
  }

  const pageList = data.pageCollection.items

  return (
    <Box
      sx={{
        display: 'flex',
        flexFlow: 'row wrap',
        '::after': { content: `''`, flexGrow: '100' },
      }}
    >
      {pageList.map(page => (
        <Box
          id="pageList"
          key={page.slug}
          sx={{
            mb: [3, 4],
            mr: [3, 4],
            flex: '1 0 auto',
          }}
        >
          <Link href={page.slug}>
            <Box
              sx={{
                width: 'fit-content',
              }}
            >
              <p sx={{ fontWeight: 'bold', m: 0, mb: 1, p: 0 }}>
                {page.title}{' '}
              </p>
              <small sx={{ fontWeight: 'normal' }}>
                Published:{' '}
                {new Date(
                  page.publishDate.replace(/-/g, '/').replace(/T.+/, ''),
                ).toLocaleDateString('en-us')}
              </small>
              <Squiggle />
            </Box>
          </Link>
        </Box>
      ))}
    </Box>
  )
}
