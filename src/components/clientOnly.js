import React, { useState, useEffect } from 'react';

export default function ClientOnly({ children, ...delegated }) {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  if (!hasMounted) {
    return null;
  }
  return <React.Fragment {...delegated}>{children}</React.Fragment>;
}
