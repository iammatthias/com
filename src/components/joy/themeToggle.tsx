import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { styled } from '@/styles/stitches.config';
import { SunIcon, MoonIcon } from '@radix-ui/react-icons';
import * as TogglePrimitive from '@radix-ui/react-toggle';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const toggleTheme = () => {
    const targetTheme = resolvedTheme === `light` ? `dark` : `light`;

    setTheme(targetTheme);
  };

  const StyledToggle = styled(TogglePrimitive.Root, {
    height: `15px`,
    border: `none`,
    backgroundColor: `transparent`,
    margin: 0,
    padding: 0,
  });

  return (
    <StyledToggle aria-label="Color mode toggle" onClick={toggleTheme}>
      {resolvedTheme === `light` ? (
        <SunIcon id="sun" />
      ) : (
        <MoonIcon id="moon" />
      )}
    </StyledToggle>
  );
}
