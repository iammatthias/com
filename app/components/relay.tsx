'use client';

import components from './components.module.css';

import { Window, Launcher } from '@relaycc/receiver';

export default function Relay(): any {
  return (
    <div>
      <Window />
      <Launcher />
    </div>
  );
}
