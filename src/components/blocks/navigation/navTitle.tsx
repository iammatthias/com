import { useEffect, useState } from 'react';
import { Box } from '@/components/primitives/box';
import { Text } from '@/components/primitives/text';
import Sparkle from '@/components/joy/sparkle';

export default function NavTitle() {
  const [globalCoords, setGlobalCoords] = useState({ x: 0, y: 0 });

  const addSpan = (letter: any) => {
    const weightedSpan = [...letter].map((letter, index) => (
      <span
        key={letter + index}
        style={{ fontVariationSettings: `'wght' 900` }}
        className="letter"
      >
        {letter}
      </span>
    ));

    return weightedSpan;
  };

  function setFontWeight(letters: any) {
    letters.forEach((element: any) => {
      const position = element.getBoundingClientRect();

      // Calculate The Distance Between Cursor And Target Elements
      const distance = Math.ceil(
        Math.sqrt(
          (position.left - globalCoords.x) ** 2 +
            (position.top - globalCoords.y) ** 2,
        ),
      );

      console.log(distance);

      // The Longer The Distance The Lower The Font Weight
      element.setAttribute(
        `style`,
        `font-variation-settings: 'wght' ${400 + distance * 2};`,
      );
    });
  }

  // 👇️ get global mouse coordinates
  const handleWindowMouseMove = (event: any) => {
    setGlobalCoords({
      x: event.screenX,
      y: event.screenY,
    });
    setFontWeight(document.querySelectorAll(`.letter`));
  };

  return (
    <Box
      css={{
        textAlign: `center`,
        lineHeight: `1`,
      }}
      onMouseMove={(event: any) => {
        handleWindowMouseMove(event);
      }}
    >
      <Text as="h4">{addSpan(`I am`)}</Text>
      <Text as="h1">
        <Sparkle>{addSpan(`Matthias`)}</Sparkle>
      </Text>
    </Box>
  );
}
