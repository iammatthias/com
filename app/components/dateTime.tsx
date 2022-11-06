"use client";

import { useEffect, useState } from "react";

type Props = Date;

export default function DateTime(): Props {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    var timer = setInterval(() => setDate(new Date()), 1);
    return function cleanup() {
      clearInterval(timer);
    };
  });

  console.log(date);
  return date;
}
