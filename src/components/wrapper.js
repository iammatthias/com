/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx } from 'theme-ui';
import styled from '@emotion/styled';
import { lighten } from '@theme-ui/color';
import Toggle from './toggle';

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
          padding: ['1rem', '2rem', '4rem'],
          width: '100%',
          maxWidth: ['100vw', props.wrapped ? '75vw' : '100vw'],
          height: '100%',
          borderRadius: '4px',
          position: 'relative',
        }}
      >
        <Toggle
          sx={{
            position: 'absolute',
            top: '-3.5rem',
            right: ['1rem', '2rem', '5rem'],
          }}
        />
        {props.children}
      </section>
    </Main>
  );
};

export default Wrapped;
