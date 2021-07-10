/** @jsx jsx */
import { jsx, useColorMode, Switch } from 'theme-ui';
import React from 'react'; //eslint-disable-line
const ColorToggle = (props) => {
  const [mode, setMode] = useColorMode();
  return (
    <Switch
      onClick={(e) => {
        const next = mode === 'dark' ? 'light' : 'dark';
        setMode(next);
      }}
      sx={{
        mr: '0',
        bg: 'text',
        '> div': {
          bg: 'background',
        },
        // This will not be visible since the input is hidden
        // '&:checked': {
        //   backgroundColor: 'primary'
        // },
        // This will be visible
        'input:checked ~ &': {
          backgroundColor: 'text',
        },
      }}
    />
  );
};
export default ColorToggle;
