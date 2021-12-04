/** @jsxImportSource theme-ui */

// page list

import { useQuery, gql } from '@apollo/client'
import Link from 'next/link'
import { Card, Box } from 'theme-ui'
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
    <>
      {pageList.map(page => (
        <Link key={page.slug} href={page.slug}>
          <Card id="pageList">
            <small sx={{ mb: 3, display: 'block', width: 'fit-content' }}>
              {new Date(
                page.publishDate.replace(/-/g, '/').replace(/T.+/, ''),
              ).toLocaleDateString('en-us')}
            </small>
            <p sx={{ fontSize: [1, 2], fontWeight: 'bold', m: 0, mb: 1, p: 0 }}>
              {page.title}
            </p>
            <Squiggle squiggleWidth={8} />
          </Card>
        </Link>
      ))}
    </>
  )
}
