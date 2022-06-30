import { useEffect, useState } from 'react';

export const Timestamp = () => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return function cleanup() {
      clearInterval(timer);
    };
  });

  return (
    <>
      {date.toLocaleTimeString([], {
        hour: `2-digit`,
        minute: `2-digit`,
      })}
    </>
  );
};

export default Timestamp;
