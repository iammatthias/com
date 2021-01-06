import React from 'react';
import { ThemeProvider, useColorMode } from 'theme-ui';

import theme from './../gatsby-plugin-theme-ui';

// components
import Wrapper from './wrapper';
import { MDXGlobalComponents } from './joy/mdx';

export default function Layout({ children, wrapped, location }) {
  const [colorMode, setColorMode] = useColorMode();

  return (
    <ThemeProvider
      theme={theme}
      components={MDXGlobalComponents}
      location={location}
    >
      <button
        onClick={(e) => {
          setColorMode(colorMode === 'light' ? 'dark' : 'light');
        }}
      >
        Toggle {colorMode === 'default' ? 'Dark' : 'Light'}
      </button>
      <Wrapper wrapped={wrapped} location={location}>
        {children}
      </Wrapper>
    </ThemeProvider>
  );
}
