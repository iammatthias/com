"use client";

import { useEffect, useState, useMemo } from "react";
import { ReactElement } from "react";

export function CurrentTime(): ReactElement {
  const timeOptions = useMemo(
    (): Intl.DateTimeFormatOptions => ({
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    []
  );

  const [time, setTime] = useState(
    new Date().toLocaleTimeString("en-US", timeOptions)
  );

  useEffect(() => {
    const timer = setInterval(
      () => setTime(new Date().toLocaleTimeString("en-US", timeOptions)),
      1000
    );
    return () => clearInterval(timer);
  }, [timeOptions]);

  return <>{time}</>;
}

export function CurrentDate(): ReactElement {
  const [date, setDate] = useState(new Date().toLocaleDateString());

  useEffect(() => {
    const timer = setInterval(
      () =>
        setDate(
          new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        ),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  return <>• {date}</>;
}

export function CurrentWeather(): ReactElement {
  const [temperature, setTemperature] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=33.77&longitude=-118.19&current_weather=true&temperature_unit=fahrenheit`
      );
      const data = await res.json();

      setTemperature(data.current_weather.temperature);
    })();
  }, []);

  if (temperature === null) {
    return <></>;
  }

  return <>• {temperature}°F</>;
}
