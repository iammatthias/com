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
        p: [3, 3, 4],
        bg: 'muted',
        borderRadius: '4px 4px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ width: 'fit-content' }}>
        <h2>{props.pageTitle}</h2>
        <br />
        <Squiggle />
        <br />
      </Box>

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
        <Button title="Discuss on Twitter">Discuss on Twitter</Button>
      </Link>
    </Box>
  )
}
