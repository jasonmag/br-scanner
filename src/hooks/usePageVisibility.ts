"use client";

import { useEffect, useState } from "react";

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const update = () => {
      setIsVisible(document.visibilityState !== "hidden");
    };

    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return isVisible;
}
