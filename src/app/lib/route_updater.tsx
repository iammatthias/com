"use client";

import React, { ReactElement, ReactNode, useEffect, useState } from "react";
import debounce from "lodash.debounce";

interface RouteUpdaterProps {
  children: ReactNode;
}

export default function RouteUpdater({ children }: RouteUpdaterProps) {
  const [activeId, setActiveId] = useState("");

  const handleIntersect = debounce(([entry]: any) => {
    if (entry.isIntersecting) {
      setActiveId(entry.target.id);
      window.history.pushState(null, "", `#${entry.target.id}`);
    }
  }, 10); // Adjust debounce delay as needed

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "0px",
      threshold: 0.6, // Adjust threshold as needed
    });

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const element = document.getElementById(
          (child as ReactElement).props.id
        );
        if (element) observer.observe(element);
      }
    });

    return () => {
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const element = document.getElementById(
            (child as ReactElement).props.id
          );
          if (element) observer.unobserve(element);
        }
      });
    };
  }, [children]);

  return <>{children}</>;
}
