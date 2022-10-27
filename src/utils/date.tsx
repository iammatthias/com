"use client";

import { useState, useEffect } from "react";

// export current date
export default function CalendarDate() {
  const [date, setDate] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDate(new Date().toLocaleDateString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return date;
}
