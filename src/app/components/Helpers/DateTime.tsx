"use client";

import { useEffect, useState } from "react";

export default function DateAndTime(): any {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1);
    return function cleanup() {
      clearInterval(timer);
    };
  });

  const date = dateTime.toLocaleDateString();
  const time = dateTime.toLocaleTimeString(`en-US`, {
    hour12: false,
    hour: `2-digit`,
    minute: `2-digit`,
    timeZoneName: `short`,
  });
  return (
    <>
      <p>{time}</p>
      <p>{date}</p>
    </>
  );
}
