/** @jsxImportSource theme-ui */

// mobile only

export default function MobileOnly({ children, props }) {
  return (
    <span
      {...props}
      sx={{
        display: ['inline', 'none'],
      }}
    >
      {children}
    </span>
  )
}
