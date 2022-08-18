// Squiggle
// Language: typescript

// A squiggle. Use this instead of `<hr/>` for a bit of character.

import useMeasure from 'react-use-measure';

import Box from '@/components/Box';

import { squiggle, squiggleContainer } from './squiggle.css';

const range = (start: number, end: number) =>
  Array.from({ length: end - start }, (v, k) => k + start);

type Props = {
  height: number;
  strokeColor: string;
  squiggleWidth: number;
};

export default function Squiggle({
  height,
  strokeColor,
  squiggleWidth,
}: Props) {
  const [svgRef, bounds] = useMeasure();

  const numOfSquiggles = squiggleWidth
    ? Math.floor(bounds.width / squiggleWidth)
    : Math.round(bounds.width / 16);

  const roundedSquiggleWidth = bounds.width / numOfSquiggles;
  const svgWidth = numOfSquiggles * roundedSquiggleWidth;

  const linePositionY = height / 2;

  const initialPoint = { x: 0, y: linePositionY };

  const instructions = range(0, numOfSquiggles).reduce((acc: any, i: any) => {
    const sideMultiplier = i % 2 === 0 ? 1 : -1;

    const lastPointX = i * roundedSquiggleWidth;
    const controlPointX = lastPointX + roundedSquiggleWidth / 2;
    const controlPointY =
      linePositionY + (roundedSquiggleWidth / 2) * sideMultiplier;
    const x = lastPointX + roundedSquiggleWidth;
    const y = linePositionY;

    const instruction = `Q ${controlPointX},${controlPointY} ${x},${y}`;
    return `${acc} ${instruction}`;
  }, `M ${initialPoint.x},${initialPoint.y}`) as string;

  return (
    <Box id="squiggleContainer" ref={svgRef} className={squiggleContainer}>
      <svg
        id="squiggle"
        className={squiggle}
        width={svgWidth ? svgWidth : `0`}
        height={height}
        style={{
          stroke: strokeColor,
        }}
      >
        <path d={instructions} fill="none" strokeLinecap="round" />
      </svg>
    </Box>
  );
}

Squiggle.defaultProps = {
  squiggleWidth: 32,
  height: 32,
  strokeColor: `currentColor`,
};
