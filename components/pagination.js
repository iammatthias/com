/** @jsxImportSource theme-ui */

// page list

import { useQuery, gql } from '@apollo/client'
import { Box, Button } from 'theme-ui'
import Link from 'next/link'
import Loading from './loading'
import Squiggle from './squiggle'

const QUERY = gql`
  query ($type: String) {
    paginationNext: pageCollection(
      order: publishDate_DESC
      skip: 1
      limit: 1
      where: { pageType: $type }
    ) {
      total
      items {
        slug
      }
    }
    paginationPrev: pageCollection(
      order: publishDate_DESC
      skip: -1
      limit: 1
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

  const paginationNext = data.paginationNext.items[0].slug
  const paginationPrev = data.paginationPrev.items[0].slug

  console.log(paginationPrev)

  return (
    <Box>
      <Squiggle />
      <Box mt={4}>
        <Link href={paginationPrev}>
          <Button>Previous</Button>
        </Link>
        &nbsp;&nbsp;&nbsp;
        <Link href={paginationNext}>
          <Button>Next</Button>
        </Link>
      </Box>
    </Box>
  )
}
