"use client";

import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";
import Icon from "./Icon";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 text-mist" />
    );
  }

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 text-mist hover:bg-ink/6 hover:text-ink transition-colors"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon name={isDark ? "sun" : "moon"} size={14} />
    </button>
  );
}
