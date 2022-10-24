import { useState, useEffect } from "react";

// export current time in 24 hour format
export default function Time() {
  const [time, setTime] = useState(new Date().toLocaleTimeString("en-US", { hour12: false }));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}
