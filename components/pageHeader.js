/** @jsxImportSource theme-ui */
import { Box } from 'theme-ui'

// page header

export default function Spicy({ children, ...props }) {
  const comments = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/${props.slug}`,
  )}`
  return (
    <Box {...props} sx={{ p: 4, bg: 'muted', borderRadius: '4px 4px 0 0' }}>
      <h2>{props.pageTitle}</h2>
      <hr />
      <small>
        Published: {props.publishDate}
        &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
        {props.readingTime} <em>min to read</em>
        &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
        {props.wordsCount} <em>words</em>
      </small>
      <br />
      {comments}
    </Box>
  )
}
