import { useEffect, useState } from "react";

export default function useDarkMode() {
  // Initialize dark mode from localStorage or system preference
  const [dark, setDark] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return JSON.parse(savedMode);
    }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    // Apply dark mode class to document
    document.documentElement.classList.toggle("dark", dark);
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(dark));
  }, [dark]);

  return [dark, setDark];
}
