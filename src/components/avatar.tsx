// People get a circle, teams a rounded square, so the two are told apart at a glance.
export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return [parts[0], ...(parts.length > 1 ? [parts.at(-1)!] : [])].map(part => Array.from(part)[0]).join("").toLocaleUpperCase();
}

export function Avatar({ name, kind, className = "" }: { name: string; kind: "person" | "team"; className?: string }) {
  return <span aria-hidden="true" className={`avatar avatar-${kind} ${className}`.trim()}>{initialsOf(name)}</span>;
}
