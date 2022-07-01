// Background
// Language: typescript

// A component that sets a fixed position fullscreen background that renders inline base64 noise under a radial gradient.

import Box from '@/components/Box';

import { backgroundRecipe } from './Background.css';

export const Background = () => {
  return (
    <Box as="section" className={backgroundRecipe({ background: `noisy` })} />
  );
};

export default Background;
