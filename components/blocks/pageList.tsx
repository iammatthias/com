// page list

import { useQuery, gql } from '@apollo/client'
import Link from 'next/link'
import Box from '../primitives/box'
import { isDev } from '@/lib/isDev'
import P from '../primitives/text/P'
import Small from '../primitives/text/small'
import Squiggle from '../joy/squiggle'

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

  return (
    <Box
      css={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: 'auto',
        gridGap: '1rem 2rem',
        '@bp1': { gridTemplateColumns: '1fr' },
        '@bp2': { gridTemplateColumns: '1fr 1fr' },
        '@bp3': { gridTemplateColumns: '1fr 1fr' },
        '@bp4': { gridTemplateColumns: '1fr 1fr 1fr' },
      }}
    >
      {pageList.map((page: any) => (
        <Box key={page.slug}>
          <Link href={page.slug}>
            <a
              style={{
                color: 'inherit',
                textDecoration: 'none',
                width: '100%',
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
    </Box>
  )
}
