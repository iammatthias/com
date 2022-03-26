// clientOnly

import { Fragment, useEffect, useState } from 'react';

export default function ClientOnly({ children, props, ...delegated }: any) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return (
    <Fragment {...delegated} {...props}>
      {children}
    </Fragment>
  );
}
