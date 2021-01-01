import React from 'react';
import styled from '@emotion/styled';

const Main = styled.main`
  margin: 0 auto;
  padding: 1rem;
  width: 100%;
  max-width: 61.8vw;
  height: 100%;
  min-height: 100vh;
`;

const Wrapped = (props) => {
  return <Main {...props}>{props.children}</Main>;
};

export default Wrapped;
