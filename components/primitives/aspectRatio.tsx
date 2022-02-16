import { styled } from '@stitches/react'
import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio'

const Aspect = AspectRatioPrimitive
export default function AspectRatio({ children, ratio }: any) {
  return <Aspect.Root ratio={ratio}>{children}</Aspect.Root>
}
