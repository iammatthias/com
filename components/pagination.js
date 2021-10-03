/** @jsxImportSource theme-ui */

// page list

import { useQuery, gql } from '@apollo/client'
import { Box, Button } from 'theme-ui'
import Link from 'next/link'
import Loading from './loading'
import Squiggle from './squiggle'

const QUERY = gql`
  query ($type: String) {
    pagination: pageCollection(
      order: publishDate_DESC
      where: { pageType: $type }
    ) {
      total
      items {
        slug
      }
    }
  }
`

export default function PageList(props) {
  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      type: props.type,
      slug: props.slug,
    },
  })

  if (loading) {
    return (
      <Box sx={{ width: 'fit-content', margin: '0 auto' }}>
        <Loading />
        <Squiggle />
      </Box>
    )
  }

  if (error) {
    console.error(error)
    return null
  }
  const paginationTotal = data.pagination.total
  const paginationIndex = data.pagination.items
    .map(item => item.slug)
    .indexOf(props.slug)

  const prev =
    paginationIndex + 1 == paginationTotal
      ? paginationIndex
      : paginationIndex + 1
  const next = paginationIndex - 1 == -1 ? 0 : paginationIndex - 1

  const paginationPrev = data.pagination.items[prev].slug
  const paginationNext = data.pagination.items[next].slug

  return (
    <Box>
      <Squiggle />
      <Box mt={4}>
        <Link href={paginationNext}>
          <Button>Next</Button>
        </Link>
        &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;{paginationIndex + 1} /{' '}
        {paginationTotal}
        &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
        <Link href={paginationPrev}>
          <Button>Previous</Button>
        </Link>
      </Box>
    </Box>
  )
}
