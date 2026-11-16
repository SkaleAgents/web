"use client";

import { useState } from "react";

// People get a circle, teams a rounded square, so the two are told apart at a glance.
export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return [parts[0], ...(parts.length > 1 ? [parts.at(-1)!] : [])].map(part => Array.from(part)[0]).join("").toLocaleUpperCase();
}

export function Avatar({ name, kind, className = "", src }: { name: string; kind: "person" | "team"; className?: string; src?: string | null }) {
  const [failed, setFailed] = useState(false);
  // Google photos refuse hotlinks that send a referrer; a broken image falls back to initials.
  return <span aria-hidden="true" className={`avatar avatar-${kind} ${className}`.trim()}>
    {/* eslint-disable-next-line @next/next/no-img-element -- a 40px avatar gains nothing from next/image */}
    {src && !failed ? <img src={src} alt="" referrerPolicy="no-referrer" className="avatar-photo" onError={() => setFailed(true)} /> : initialsOf(name)}
  </span>;
}
