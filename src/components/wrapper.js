/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx } from 'theme-ui';
import { lighten, darken } from '@theme-ui/color';
import Switch from './switch';
import Logomark from './logomark';
import Menu from './menu';

const Wrapped = (props) => {
  return (
    <main
      sx={{
        margin: '5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <section
        {...props}
        sx={{
          backgroundColor: lighten('background', 0.025),
          width: '100%',
          maxWidth: [
            '100vw',
            props.wrapped ? '85vw' : '100vw',
            props.wrapped ? '75vw' : '100vw',
          ],
          height: '100%',
          minHeight: '80vh',
          borderRadius: '4px',
          position: 'relative',
        }}
      >
        <Logomark
          sx={{
            position: 'absolute',
            top: '-3.5rem',
            left: ['1rem', '2rem', '4rem'],
          }}
        />
        <Switch
          sx={{
            position: 'absolute',
            top: '-3.5rem',
            right: ['1rem', '2rem', '4rem'],
          }}
        />
        <Menu
          sx={{
            position: ['relative', 'absolute'],
            padding: ['1rem', '0'],
            top: ['', '2rem'],
            right: ['', '-2.5rem'],
            writingMode: ['', 'vertical-rl'],
            textOrientation: 'mixed',
            backgroundColor: [darken('background', 0.025), 'transparent'],
            width: 'auto',
          }}
        />
        {props.children}
      </section>
    </main>
  );
};

export default Wrapped;
