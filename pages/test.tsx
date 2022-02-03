// pages/index.tsx

import H1 from '@/components/primitives/text/H1'
import type { ReactElement } from 'react'
import PageList from '@/components/blocks/pageList'
import Sparkles from '@/components/joy/sparkle'

// components

export default function Test({ mdx }: any) {
  return (
    <article>
      <H1>
        <Sparkles>Test stuff here</Sparkles>
      </H1>
      <PageList type="Gallery" />
      <PageList type="Blog" />
    </article>
  )
}
