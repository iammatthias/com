import Box from '../primitives/box'
import Button from '../primitives/button'
import Link from 'next/link'
import Squiggle from '../joy/squiggle'
import H1 from '../primitives/text/H1'
import Small from '../primitives/text/small'
// page header

export default function PageHeader({ children, ...props }: any) {
  const comments = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/${props.slug}`,
  )}`
  return (
    <Box {...props} className="pageHeader" css={{ margin: '0 0 16px' }}>
      <Box css={{ width: 'fit-content', margin: '0 0 16px' }}>
        {props.pageType === 'Blog' ||
          (props.pageType === 'Gallery' && (
            <Small css={{ display: 'block', width: 'fit-content' }}>
              Published: {props.publishDate}
              {/* {props.readingTime > 0 ? (
              <span>
                {spacer} {props.readingTime} <em> min to read</em> {spacer}{' '}
                {props.wordsCount} <em> words</em>
              </span>
            ) : null} */}
            </Small>
          ))}
        <H1 css={{ width: 'fit-content', margin: '8px 0 16px' }}>
          {props.pageTitle}
        </H1>
        {props.pageType === 'Blog' ||
          (props.pageType === 'Gallery' && (
            <Link href={comments}>
              <Button
                sx={{ width: ['100%', '250px'] }}
                title="Discuss on Twitter"
              >
                Discuss on Twitter
              </Button>
            </Link>
          ))}
      </Box>
      <Squiggle />
    </Box>
  )
}
