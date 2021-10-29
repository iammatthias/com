/** @jsxImportSource theme-ui */

// page list

import { useQuery, gql } from '@apollo/client'
import { Box, Button } from 'theme-ui'
import Link from 'next/link'
import Loading from './loading'
import Squiggle from './squiggle'
import { isDev } from './isDev'

const QUERY = gql`
  query ($preview: Boolean, $type: String) {
    pagination: pageCollection(
      preview: $preview
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
      preview: isDev,
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
      <Box
        sx={{ mt: 4, display: 'flex', flexDirection: ['column', '', 'row'] }}
      >
        <Link href={paginationNext}>
          <Button sx={{ mb: [3, '', 0] }}>Next</Button>
        </Link>
        <span sx={{ mb: [3, '', 0] }}>
          &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;{paginationIndex + 1} /{' '}
          {paginationTotal}
          &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
        </span>
        <Link href={paginationPrev}>
          <Button>Previous</Button>
        </Link>
      </Box>
    </Box>
  )
}
