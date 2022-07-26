// Background
// Language: typescript

// A component that sets a fixed position fullscreen background that renders inline base64 noise under a radial gradient.

import Box from '@/_components/Box';

import { background } from './background.css';

export const Background = () => {
  return <Box as="section" className={`${background}`} />;
};

export default Background;
