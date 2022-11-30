'use client';

import { Receiver } from '@relaycc/receiver';

export function Providers({ children }: { children: React.ReactNode }) {
  return <Receiver config={null}>{children}</Receiver>;
}
