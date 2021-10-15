/** @jsxImportSource theme-ui */

// page list

import { useQuery, gql } from '@apollo/client'
import Link from 'next/link'
import { Card, Box } from 'theme-ui'
import Loading from './loading'
import Squiggle from './squiggle'

const QUERY = gql`
  query ($type: String, $limit: Int) {
    pageCollection(
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
          <Card>
            <p sx={{ fontSize: 1, fontWeight: 'bold', m: 0, p: 0 }}>
              {page.title}
            </p>
            <small>
              {new Date(page.publishDate).toLocaleDateString('en-us')}
            </small>
          </Card>
        </Link>
      ))}
    </>
  )
}
