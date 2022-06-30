// background.tsx

import React from 'react';

import Box from '@/components/Box';

import { backgroundRecipe } from './Background.css';

export const Background = () => {
  return (
    <Box as="section" className={backgroundRecipe({ background: `noisy` })} />
  );
};

export default Background;
