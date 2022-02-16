import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { styled } from '@/lib/stitches.config'
import { SunIcon, MoonIcon } from '@radix-ui/react-icons'
import * as TogglePrimitive from '@radix-ui/react-toggle'

export default function ColorToggle() {
  const [mounted, setMounted] = useState(false)
  const { setTheme, resolvedTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const toggleTheme = () => {
    const targetTheme = resolvedTheme === 'light' ? 'dark' : 'light'

    setTheme(targetTheme)
  }

  const StyledToggle = styled(TogglePrimitive.Root, {
    width: '39px',
    height: '39px',
    padding: '12px',
    border: 'none',
    backgroundColor: 'transparent',
  })

  return (
    <StyledToggle aria-label="Color mode toggle" onClick={toggleTheme}>
      {resolvedTheme === 'light' ? (
        <SunIcon id="sun" />
      ) : (
        <MoonIcon id="moon" />
      )}
    </StyledToggle>
  )
}
