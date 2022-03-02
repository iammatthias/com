import { useQuery, gql } from '@apollo/client'
import { isDev } from '@/lib/isDev'
import { styled } from '@stitches/react'
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import Link from 'next/link'

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

export default function NavigationQuery(props: any) {
  const itemStyles = {
    margin: '0',
    padding: '0',
    outline: 'none',
    userSelect: 'none',
    fontWeight: 500,
    lineHeight: 1,
    borderRadius: 4,
    fontSize: 15,
    color: '$colors$slate12',
    $$shadowColor: '$colors$slate12',
    '&:focus': { position: 'relative', boxShadow: `0 0 0 1px $$shadowColor` },
  }

  const StyledLink = styled('a', {
    ...itemStyles,
    display: 'block',
    textDecoration: 'none',
    lineHeight: 1,
  })

  const ListItem = styled('div')

  const LinkTitle = styled('p', {
    fontWeight: 'Bold',
    lineHeight: 1.2,
    margin: '0 0 8px',
    fontSize: '15px',
    wordWrap: 'break-word',
  })

  const LinkText = styled('p', {
    fontSize: '12px',
    lineHeight: 1.4,
  })

  const { data, loading, error } = useQuery(QUERY, {
    variables: {
      type: props.type,
      limit: parseInt(props.limit),
      preview: isDev,
    },
  })

  if (loading) {
    return null
  }

  if (error) {
    console.error(error)
    return null
  }

  const pageList = data.pageCollection.items

  return pageList.map((page: any, index: number) => (
    <ListItem key={index}>
      <Link href={`/${page.slug}`} passHref>
        <StyledLink>
          <LinkTitle>{page.title}</LinkTitle>
          <LinkText>
            Published:{' '}
            {new Date(
              page.publishDate.replace(/-/g, '/').replace(/T.+/, ''),
            ).toLocaleDateString('en-us')}
          </LinkText>
        </StyledLink>
      </Link>
    </ListItem>
  ))
}
