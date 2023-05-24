"use client";

import { useEffect, useState, useMemo } from "react";

export function CurrentTime() {
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
      60000
    );
    return () => clearInterval(timer);
  }, [timeOptions]);

  return <>{time}</>;
}

export function CurrentDate() {
  const [date, setDate] = useState(new Date().toLocaleDateString());

  useEffect(() => {
    const timer = setInterval(
      () => setDate(new Date().toLocaleDateString()),
      86400000
    );
    return () => clearInterval(timer);
  }, []);

  return <>• {date}</>;
}

export function CurrentWeather() {
  const [temperature, setTemperature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=33.77&longitude=-118.19&current_weather=true&temperature_unit=fahrenheit`
        );
        const data = await res.json();

        setTemperature(data.current_weather.temperature);
      } catch (error) {
        setError("Error fetching weather data");
      }
    })();

    const intervalId = setInterval(async () => {
      // Fetch data every 10 minutes (or any other interval you deem necessary)
    }, 600000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  if (error) {
    return <>{error}</>;
  }

  if (temperature === null) {
    return <>• ??°F</>;
  }

  return <>• {temperature}°F</>;
}
