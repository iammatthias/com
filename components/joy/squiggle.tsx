// squiggle

import { useRef } from 'react'
import Box from '../primitives/box'
import { range } from '@/lib/range'
import { useContainerDimensions } from '@/lib/useContainerDimensions'

export default function Squiggle({
  height,
  strokeColor,
  squiggleWidth,
  ...props
}: any) {
  const svgRef = useRef(null)

  const { width } = useContainerDimensions(svgRef)

  const numOfSquiggles = Math.round(width / squiggleWidth) + 2
  const roundedSquiggleWidth = width / numOfSquiggles

  const linePositionY = height / 2

  const initialPoint = { x: 0, y: linePositionY }

  const instructions = range(0, numOfSquiggles).reduce((acc: any, i: any) => {
    const sideMultiplier = i % 2 === 0 ? 1 : -1

    const lastPointX = i * roundedSquiggleWidth
    const controlPointX = lastPointX + roundedSquiggleWidth / 2
    const controlPointY =
      linePositionY + (roundedSquiggleWidth / 2) * sideMultiplier
    const x = lastPointX + roundedSquiggleWidth
    const y = linePositionY

    const instruction = `Q ${controlPointX},${controlPointY} ${x},${y}`
    return `${acc} ${instruction}`
  }, `M ${initialPoint.x},${initialPoint.y}`) as string

  return (
    <Box
      id="squiggleContainer"
      ref={svgRef}
      css={{ width: '100%', margin: '0 auto', color: '$colors$slate12' }}
      {...props}
    >
      <svg
        id="squiggle"
        width={numOfSquiggles * roundedSquiggleWidth}
        height={height}
        style={{
          display: 'block',
          overflow: 'visible',
          stroke: strokeColor,
          textAlign: 'center',
          strokeWidth: '2',
        }}
      >
        <path d={instructions} fill="none" strokeLinecap="round" />
      </svg>
    </Box>
  )
}

Squiggle.defaultProps = {
  squiggleWidth: 8,
  height: 24,
  strokeColor: 'currentColor',
}
