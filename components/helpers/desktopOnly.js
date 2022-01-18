/** @jsxImportSource theme-ui */

// desktop only

export default function DesktopOnly({ children, props }) {
  return (
    <span
      {...props}
      sx={{
        display: ['none', 'inline'],
      }}
    >
      {children}
    </span>
  )
}
