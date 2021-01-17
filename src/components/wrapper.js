/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx } from 'theme-ui';
import styled from '@emotion/styled';
import { lighten } from '@theme-ui/color';

const Main = styled.main`
  margin: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Section = styled('section')`
  padding: 2rem;
  width: 100%;
  max-width: ${(props) => (props.wrapped ? '61.8vw' : '100vw')};
  height: 100%;
  border-radius: 4px;
`;

const Wrapped = (props) => {
  return (
    <Main>
      <Section {...props} sx={{ background: lighten('background', 0.025) }}>
        {props.children}
      </Section>
    </Main>
  );
};

export default Wrapped;
