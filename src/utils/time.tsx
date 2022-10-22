import { useState, useEffect } from 'react';

export default function Time() {
  const [dateState, setDateState] = useState(new Date());
  useEffect(() => {
    setInterval(() => setDateState(new Date()), 60);
  }, []);

  const currentTime = dateState.toLocaleString(`en-US`, {
    hour: `numeric`,
    minute: `numeric`,
    hour12: true,
  });

  if (currentTime !== undefined) {
    return <span>{currentTime}</span>;
  }

  return null;
}
