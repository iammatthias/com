// Client Only

import { useEffect, useState } from 'react'

export default function ClientOnly({ children }) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true), console.log({ hasMounted })
  }, [])

  if (!hasMounted) {
    return null, console.log({ hasMounted })
  }

  return { children }
}
