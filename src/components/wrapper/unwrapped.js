import React from 'react';
import styled from '@emotion/styled';

const Main = styled.main`
  margin: 0 auto;
  padding: 1rem;
  width: 100vw;
  min-height: 100vh;
`;

const Unwrapped = (props) => {
  return <Main {...props}>{props.children}</Main>;
};

export default Unwrapped;
