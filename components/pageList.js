/** @jsxImportSource theme-ui */

// page list

import { useQuery, gql } from '@apollo/client'
import Link from 'next/link'
import { Card, Text } from 'theme-ui'

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
    return <h2>Loading...</h2>
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
            <Text>
              <p sx={{ fontSize: 1, fontWeight: 'bold', m: 0, p: 0 }}>
                {page.title}
              </p>
              <small>
                {new Date(page.publishDate).toLocaleDateString('en-us')}
              </small>
            </Text>
          </Card>
        </Link>
      ))}
    </>
  )
}
