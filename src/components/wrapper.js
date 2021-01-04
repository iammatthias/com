import React from 'react';
import styled from '@emotion/styled';

const Main = styled.main`
  margin: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Section = styled('section')`
  padding: 1rem;
  width: 100%;
  max-width: ${(props) => (props.wrapped ? '61.8vw' : '100vw')};
  height: 100%;
  min-height: calc(100vh - 2rem);
  border: 1px solid red;
`;

const Wrapped = (props) => {
  return (
    <Main {...props}>
      <Section {...props}>{props.children}</Section>
    </Main>
  );
};

export default Wrapped;
