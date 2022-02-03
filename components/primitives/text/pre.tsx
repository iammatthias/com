// code
import { styled } from '@/lib/stitches.config'
export default function Pre({ children }: any) {
  const Pre = styled('pre', {
    whiteSpace: 'pre-wrap',
    border: '1px solid',
    borderColor: '$colors$slate8',
    borderRadius: '4px',
    padding: '12px',
    fontSize: '14px',
    lineHeight: '1.5',
    '> code': {
      border: 'none !important',
      padding: '0 !important',
    },
  })
  return <Pre>{children}</Pre>
}
