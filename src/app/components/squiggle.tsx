"use client";
import React, { useRef, useEffect, useState } from "react";

const range = (start: number, end: number) =>
  Array.from({ length: end - start }, (v, k) => k + start);

function Squiggle({
  height = 24,
  strokeColor = "currentColor",
  squiggleWidth = 8,
  ...props
}) {
  const svgContainerRef = useRef<HTMLDivElement>(null); // <--- specify the type here
  const [bounds, setBounds] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (svgContainerRef.current) {
      setBounds({
        width: svgContainerRef.current.offsetWidth,
        height: svgContainerRef.current.offsetHeight,
      });
    }
  }, []);

  const numOfSquiggles = squiggleWidth
    ? Math.floor(bounds.width / squiggleWidth)
    : Math.round(bounds.width / 16);

  const roundedSquiggleWidth = bounds.width / numOfSquiggles;
  const svgWidth = numOfSquiggles * roundedSquiggleWidth;

  const linePositionY = height / 2;

  const initialPoint = { x: 0, y: linePositionY };

  const instructions = range(0, numOfSquiggles).reduce((acc, i) => {
    const sideMultiplier = i % 2 === 0 ? 1 : -1;

    const lastPointX = i * roundedSquiggleWidth;
    const controlPointX = lastPointX + roundedSquiggleWidth / 2;
    const controlPointY =
      linePositionY + (roundedSquiggleWidth / 2) * sideMultiplier;
    const x = lastPointX + roundedSquiggleWidth;
    const y = linePositionY;

    const instruction = `Q ${controlPointX},${controlPointY} ${x},${y}`;
    return `${acc} ${instruction}`;
  }, `M ${initialPoint.x},${initialPoint.y}`);

  return (
    <div id='squiggleContainer' ref={svgContainerRef} {...props}>
      <svg
        id='squiggle'
        width={svgWidth ? svgWidth : `0`}
        height={height}
        style={{
          display: "block",
          overflow: "visible",
          stroke: "rgb(var(--foreground-rgb))",
          textAlign: "center",
          strokeWidth: "2",
        }}>
        <path d={instructions} fill='none' strokeLinecap='round' />
      </svg>
    </div>
  );
}

export default Squiggle;
