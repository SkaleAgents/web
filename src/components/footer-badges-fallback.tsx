import { directoryBadgeEntries, directoryLinks } from "@/components/footer-badges-data";

export function FooterBadgesFallback() {
  return (
    <div className="min-w-0 border-t border-line py-5">
      <div className="mb-3 text-xs text-ink-muted">
        <p className="font-medium">Find us on</p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-ink-muted">
        {directoryBadgeEntries.map((badge) => (
          <a key={badge.href} href={badge.href} target="_blank" rel={badge.rel ?? "noopener noreferrer"} title={badge.title}>
            {badge.name}
          </a>
        ))}
        {directoryLinks.map(([name, href, rel = "noopener noreferrer", title]) => (
          <a key={href} href={href} target="_blank" rel={rel || undefined} title={title}>
            {name}
          </a>
        ))}
      </div>
    </div>
  );
}
