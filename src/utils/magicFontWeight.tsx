import { useState } from 'react';

export default function MagicFontWeight({ children }: any) {
  const [globalCoords, setGlobalCoords] = useState({ x: 0, y: 0 });

  const addSpan = (letter: any) => {
    const weightedSpan = [...letter].map((letter, index) => (
      <span
        key={letter + index}
        style={{
          fontVariationSettings: `"wght" 200, "wdth" 0, "DISP" 0`,
        }}
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

      // The Longer The Distance The Lower The Font Weight
      element.setAttribute(
        `style`,
        `font-variation-settings: 'wght' ${700 - distance / 2}, 'wdth' ${
          1000 - distance * 2
        }, 'DISP' ${1000 - distance * 2}  ;`,
      );
    });
  }

  // 👇️ get global mouse coordinates
  const handleWindowMouseMove = (event: any) => {
    setGlobalCoords({
      x: event.pageX,
      y: event.pageY,
    });
    setFontWeight(document.querySelectorAll(`.letter`));
  };

  if (typeof window !== `undefined`) {
    window.addEventListener(`mousemove`, handleWindowMouseMove);
  }

  return <>{addSpan(`${children}`)}</>;
}
