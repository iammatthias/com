/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, useColorMode, Switch } from 'theme-ui';

export default function Toggle(props) {
  const [colorMode, setColorMode] = useColorMode();

  function handleClick(object) {
    if (typeof window !== 'undefined') {
      window.analytics.track('Color Mode Toggled', {
        colorMode: colorMode,
      });
    }
    return object;
  }

  return (
    <Switch
      onClick={handleClick((e) => {
        setColorMode(colorMode === 'dark' ? 'default' : 'dark');
      })}
      {...props}
    />
  );
}
