"use client";

import { useState, useEffect } from "react";

type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "ISO" | "FULL";

interface FormatDateTimeProps {
  inputDate: string;
  format: DateFormat;
}

export default function FormatDateTime({
  inputDate,
  format,
}: FormatDateTimeProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    const dateObject = new Date(inputDate);

    switch (format) {
      case "MM/DD/YYYY":
        setFormattedDate(dateObject.toLocaleDateString("en-US"));
        break;
      case "DD/MM/YYYY":
        setFormattedDate(dateObject.toLocaleDateString("fr-CA"));
        break;
      case "ISO":
        setFormattedDate(dateObject.toISOString());
        break;
      case "FULL":
        const datePart = dateObject.toLocaleDateString("fr-CA");
        const timePart = dateObject.toLocaleTimeString("en-GB", {
          hour12: false,
        });
        setFormattedDate(`${datePart} ${timePart}`);
        break;
    }
  }, [inputDate, format]);

  return <>{formattedDate}</>;
}
