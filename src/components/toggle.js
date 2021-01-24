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
    border: 2px solid ${(props) => props.theme.colors.muted};
    border-radius: 34px;
    transition: 0.4s;
    &::before {
      position: absolute;
      content: '';
      height: 24px;
      width: 24px;
      left: 4px;
      bottom: 3px;
      background-color: ${(props) => props.theme.colors.background};
      transition: 0.4s;
      border-radius: 50%;
    }
    &:hover {
      border: 2px solid ${(props) => props.theme.colors.accent};
    }
  }
  input {
    &:checked + .slider {
      background-color: ${(props) => props.theme.colors.text};
      &::before {
        background-color: ${(props) => props.theme.colors.background};
        left: 0;
        right: 4px;
      }
    }
  }
  input {
    &:focus + .slider {
      box-shadow: 0 0 2px ${(props) => props.theme.colors.background};
    }
  }
  input {
    &:checked + .slider {
      &::before {
        transform: translateX(28px);
      }
    }
  }
`;

export default function Toggle(props) {
  const [colorMode, setColorMode] = useColorMode();

  return (
    <Box {...props}>
      <Label htmlFor="colorModeToggle">
        <input
          id="colorModeToggle"
          name="colorModeToggle"
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
