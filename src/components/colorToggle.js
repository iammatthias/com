/** @jsx jsx */
import { jsx, useColorMode } from 'theme-ui';
const ColorToggle = (props) => {
  const [mode, setMode] = useColorMode();
  return (
    <button
      {...props}
      sx={{ p: ['8px 12px'] }}
      onClick={(e) => {
        const next = mode === 'dark' ? 'light' : 'dark';
        setMode(next);
      }}
    >
      <span
        sx={{
          display: 'inline-block',
          lineHeight: '4px',
          textAlign: 'center',
          writingMode: ['', 'vertical-rl'],
          whiteSpace: 'nowrap',
        }}
      >
        Color Mode
      </span>
    </button>
  );
};
export default ColorToggle;
