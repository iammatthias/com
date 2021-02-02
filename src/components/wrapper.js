/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx } from 'theme-ui';
import styled from '@emotion/styled';
import { lighten, darken } from '@theme-ui/color';
import Toggle from './toggle';
import Logomark from './logomark';
import Menu from './menu';

const Main = styled.main`
  margin: 5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Wrapped = (props) => {
  return (
    <Main>
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
        <Toggle
          sx={{
            position: 'absolute',
            top: '-3.5rem',
            right: ['1rem', '2rem', '4rem'],
          }}
        />
        <Menu
          sx={{
            position: ['relative', 'absolute'],
            top: ['', '9rem'],
            right: ['', '-9.5rem'],
            padding: ['1rem', '0'],
            transform: ['rotate(0deg)', 'rotate(90deg)'],
            backgroundColor: [darken('background', 0.025), 'transparent'],
          }}
        />
        {props.children}
      </section>
    </Main>
  );
};

export default Wrapped;
