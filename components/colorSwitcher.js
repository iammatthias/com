/** @jsxImportSource theme-ui */
import { IconButton, useColorMode } from 'theme-ui'
import SunIcon from './joy/sun'
import MoonIcon from './joy/moon'

const ColorSwitcher = props => {
  const [mode, setMode] = useColorMode()
  return (
    <IconButton
      onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      sx={{
        color: 'accent',
        cursor: 'pointer',
        fontSize: '16px',
      }}
      {...props}
    >
      {mode === 'dark' && <MoonIcon />}
      {mode === 'light' && <SunIcon />}
    </IconButton>
  )
}

export default ColorSwitcher
