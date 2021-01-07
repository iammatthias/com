import React from 'react';
import { ThemeProvider, useColorMode } from 'theme-ui';

import theme from './../gatsby-plugin-theme-ui';

// components
import Wrapper from './wrapper';
import { MDXGlobalComponents } from './joy/mdx';

export default function Layout({ children, wrapped }) {
  const [colorMode, setColorMode] = useColorMode();

  return (
    <ThemeProvider theme={theme} components={MDXGlobalComponents}>
      <button
        onClick={(e) => {
          setColorMode(colorMode === 'light' ? 'dark' : 'light');
        }}
      >
        Toggle {colorMode === 'light' ? 'dark' : 'light'}
      </button>
      <Wrapper wrapped={wrapped}>{children}</Wrapper>
    </ThemeProvider>
  );
}
