import Box from '../primitives/box'
import Button from '../primitives/button'
import { useQuery, gql } from '@apollo/client'
import Link from 'next/link'
import { isDev } from '@/lib/isDev'
import Squiggle from '../joy/squiggle'

// page footer

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

export default function PageFooter({ ...props }) {
  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      type: props.type,
      slug: props.slug,
      preview: isDev,
    },
  })

  if (loading) {
    return <>loading...</>
  }

  if (error) {
    console.error(error)
    return null
  }
  const paginationTotal = data.pagination.total
  const paginationIndex = data.pagination.items
    .map((item: any) => item.slug)
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
      <Box css={{ margin: '16px 0 32px' }}>
        <Squiggle />
      </Box>

      <Link href={paginationNext}>
        <a>
          <Button>Newer</Button>
        </a>
      </Link>
      <span>
        &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;{paginationIndex + 1} /{' '}
        {paginationTotal}
        &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
      </span>
      <Link href={paginationPrev}>
        <a>
          <Button>Older</Button>
        </a>
      </Link>
    </Box>
  )
}
