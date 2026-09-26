"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function ThemeSwitcher() {
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const { theme, setTheme } = useTheme();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
      <span>Theme</span>
      <select aria-label="Color theme" disabled={!mounted}
        value={mounted ? theme ?? "system" : "system"}
        onChange={event => setTheme(event.target.value)}
        className="cursor-pointer rounded-md border border-line bg-canvas-elevated px-2 py-1.5 text-sm text-ink disabled:cursor-wait">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </label>
  );
}
