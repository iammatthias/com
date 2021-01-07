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
  border: 2px solid;
  border-color: ${(props) => props.theme.colors.primary};
`;

const Wrapped = (props) => {
  return (
    <Main>
      <Section {...props}>{props.children}</Section>
    </Main>
  );
};

export default Wrapped;
