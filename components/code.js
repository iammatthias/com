/** @jsxImportSource theme-ui */

// code

export default function Code({ children, ...props }) {
  return (
    <pre sx={{ whiteSpace: props.textwrap ? 'pre-wrap' : '' }}>
      <code>{children}</code>
    </pre>
  )
}
