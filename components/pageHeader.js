/** @jsxImportSource theme-ui */
import { Box, Button } from 'theme-ui'
import Link from 'next/link'

// page header

export default function Spicy({ children, ...props }) {
  const comments = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/${props.slug}`,
  )}`

  const spacer = '\u00A0\u00A0\u00A0•\u00A0\u00A0\u00A0'
  return (
    <Box
      {...props}
      sx={{ p: [3, 3, 4], bg: 'muted', borderRadius: '4px 4px 0 0' }}
    >
      <h2>{props.pageTitle}</h2>
      <hr />
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
      <br />
      <Link href={comments}>
        <Button title="Discuss on Twitter">Discuss on Twitter</Button>
      </Link>
    </Box>
  )
}
