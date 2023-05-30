"use client";

import { useEffect } from "react";

// define umami event tracker functions
// https://umami.is/docs/tracker-functions
// umami.track(event_name, [event_data])

export function trackEvent(event_name: string, event_data: any) {
  if (typeof window.umami !== "undefined") {
    useEffect(() => {
      window.umami.track(event_name, event_data);
    }, [event_name, event_data]);
  }
}
