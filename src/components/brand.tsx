import Link from "next/link";

export function BrandLogo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} aria-label="SkaleAgents home" className="inline-flex items-center gap-2">
      <svg aria-hidden="true" className="h-7 w-7 shrink-0" viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="14" fill="#0e1518" />
        <path d="M47 16H24c-7 0-12 4-12 10s5 10 12 10h16c7 0 12 4 12 10s-5 10-12 10H17" stroke="#00c2a8" strokeLinecap="round" strokeWidth="8" />
      </svg>
      <span className="brand-wordmark font-display text-lg font-bold tracking-tight text-ink">SkaleAgents</span>
    </Link>
  );
}
