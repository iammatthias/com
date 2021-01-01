import React from 'react';
import { ThemeProvider } from 'theme-ui';

// components
import Wrapped from '../components/wrapper/wrapped';
import Unwrapped from '../components/wrapper/unwrapped';
import { MDXGlobalComponents } from './joy/mdx';

export default function Layout({ children, wrapped }) {
  return (
    <ThemeProvider components={MDXGlobalComponents}>
      {wrapped ? (
        <Wrapped>
          wrapped
          <hr />
          {children}
        </Wrapped>
      ) : (
        <Unwrapped>
          unwrapped
          <hr />
          {children}
        </Unwrapped>
      )}
    </ThemeProvider>
  );
}
