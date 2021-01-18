/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, useColorMode, Box } from 'theme-ui';
import styled from '@emotion/styled';

const Label = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${(props) => props.theme.colors.text};
    -webkit-transition: 0.4s;
    transition: 0.4s;
    &::before {
      position: absolute;
      content: '';
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: ${(props) => props.theme.colors.background};
      -webkit-transition: 0.4s;
      transition: 0.4s;
    }
  }
  input {
    &:checked + .slider {
      background-color: ${(props) => props.theme.colors.text};
      &::before {
        background-color: ${(props) => props.theme.colors.background};
      }
    }
  }
  input {
    &:focus + .slider {
      box-shadow: 0 0 1px ${(props) => props.theme.colors.background};
    }
  }
  input {
    &:checked + .slider {
      &::before {
        -webkit-transform: translateX(26px);
        -ms-transform: translateX(26px);
        transform: translateX(26px);
      }
    }
  }
  .slider.round {
    border-radius: 34px;
    &::before {
      border-radius: 50%;
    }
  }
`;

export default function Toggle(props) {
  const [colorMode, setColorMode] = useColorMode();

  return (
    <Box {...props}>
      <Label>
        <input
          type="checkbox"
          onClick={(e) => {
            setColorMode(colorMode === 'light' ? 'dark' : 'light');
          }}
        />
        <span className="slider round" />
      </Label>
    </Box>
  );
}
