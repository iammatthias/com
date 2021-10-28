/** @jsxImportSource theme-ui */
import { Box, Button } from 'theme-ui'

import Pagination from './pagination'

// page header

export default function Spicy({ children, ...props }) {
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
      <Box sx={{ width: 'fit-content', textAlign: 'center' }}>
        <Pagination type={props.type} slug={props.slug} />
      </Box>
    </Box>
  )
}