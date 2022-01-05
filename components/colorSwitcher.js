/** @jsxImportSource theme-ui */
import { IconButton, useColorMode } from 'theme-ui'

const ColorSwitcher = props => {
  const [mode, setMode] = useColorMode()
  return (
    <IconButton
      onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      sx={{
        color: 'accent',
        cursor: 'pointer',
        borderRadius: '50px',
        mx: 3,
        transition: 'box-shadow .125s ease-in-out',
        ':hover,:focus': {
          boxShadow: '0 0 0 2px',
          outline: 'none',
        },
      }}
      {...props}
    >
      <svg
        viewBox="0 0 32 32"
        width={24}
        height={24}
        fill="none"
        sx={{ borderRadius: '50px', boxShadow: 'card' }}
      >
        <circle
          cx={16}
          cy={16}
          r={14}
          stroke="currentcolor"
          strokeWidth={3}
          sx={{ fill: 'transparent' }}
        />
      </svg>
    </IconButton>
  )
}

export default ColorSwitcher
