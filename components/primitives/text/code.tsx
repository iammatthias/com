// code
import { styled } from '@/lib/stitches.config'

export default function Code({ children, ...props }: any) {
  const Code = styled('code', {
    fontFamily: '$mono',
    whiteSpace: 'pre-wrap',
    border: '1px solid',
    borderColor: '$colors$slate8',
    borderRadius: '4px',
    margin: '0 2px',
    padding: '4px',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '$colors$slate12',
    ...props.css,
  })
  return <Code>{children}</Code>
}
