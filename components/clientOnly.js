// clientOnly

import { useEffect, useState } from 'react'

export default function ClientOnly({ children, props, ...delegated }) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return null
  }

  return (
    <div {...delegated} {...props}>
      {children}
    </div>
  )
}
