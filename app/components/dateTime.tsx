'use client';

import components from './components.module.css';
import { useEffect, useState } from 'react';

export default function DateTime(): any {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    var timer = setInterval(() => setDateTime(new Date()), 1);
    return function cleanup() {
      clearInterval(timer);
    };
  });

  const date = dateTime.toLocaleDateString();
  const time = dateTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  return (
    <div className={components.clock}>
      <p>
        {date} ~ {time}
      </p>
    </div>
  );
}
