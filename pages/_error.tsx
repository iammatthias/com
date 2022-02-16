// pages/index.tsx

import H1 from '@/components/primitives/text/H1'
import P from '@/components/primitives/text/P'
import Link from 'next/link'

// components

export default function Error({ res, err }: any) {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return (
    <article>
      <H1>{statusCode}</H1>
      <P>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </P>
    </article>
  )
}
