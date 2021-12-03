/** @jsxImportSource theme-ui */
import { Box, Button } from 'theme-ui'
import Link from 'next/link'
import Squiggle from './squiggle'

// page header

export default function Spicy({ children, ...props }) {
  const comments = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/${props.slug}`,
  )}`

  const spacer = '\u00A0\u00A0\u00A0•\u00A0\u00A0\u00A0'
  return (
    <Box
      {...props}
      sx={{
        borderRadius: '4px 4px 0 0',
        display: 'flex',
        flexDirection: 'column',
        mb: 5,
      }}
    >
      <Box sx={{ width: 'fit-content', textAlign: 'center' }}>
        <h2>{props.pageTitle}</h2>
        <Squiggle />
        <br />
      </Box>

      {props.publishDate ? (
        <>
          <small>
            Published: {props.publishDate}
            {props.readingTime > 0 ? (
              <span>
                {spacer} {props.readingTime} <em> min to read</em> {spacer}{' '}
                {props.wordsCount} <em> words</em>
              </span>
            ) : null}
          </small>
          <br />
          <Link href={comments}>
            <Button
              sx={{ width: ['100%', '250px'] }}
              title="Discuss on Twitter"
            >
              Discuss on Twitter
            </Button>
          </Link>
        </>
      ) : null}
    </Box>
  )
}
