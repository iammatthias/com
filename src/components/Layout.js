import React from 'react';
import { ThemeProvider } from 'theme-ui';

import theme from './../gatsby-plugin-theme-ui';

// components
import Wrapper from './wrapper';
import Seo from './seo';
import { MDXGlobalComponents } from './joy/mdx';

export default function Layout({ children }) {
  return (
    <ThemeProvider theme={theme} components={MDXGlobalComponents}>
      <Seo />
      <Wrapper>{children}</Wrapper>
    </ThemeProvider>
  );
}
