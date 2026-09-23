export function HeroSignal() {
  return (
    <div className="hero-signal hidden md:block" aria-hidden="true">
      <p className="marketing-eyebrow mb-4 text-center">Context in. Clarity out.</p>
      <svg viewBox="0 0 320 330" fill="none" className="w-full">
        <circle cx="160" cy="164" r="130" className="hero-orbit" />
        <circle cx="160" cy="164" r="104" className="hero-orbit hero-orbit-inner" />
        <path d="M160 67V119M160 199V263M56 164H110M210 164H264" className="hero-signal-line" />
        <path d="M160 67V119M160 199V263M56 164H110M210 164H264" className="hero-signal-flow" />
        <rect x="77" y="23" width="166" height="44" rx="8" className="hero-signal-node" />
        <text x="160" y="50" textAnchor="middle" className="hero-signal-label">Source + infrastructure</text>
        <rect x="110" y="119" width="100" height="80" rx="18" className="hero-signal-core" />
        <path d="M176 140H151C139 140 139 157 151 157H169C181 157 181 175 169 175H144" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="56" cy="164" r="5" className="hero-signal-pulse" />
        <circle cx="264" cy="164" r="5" className="hero-signal-pulse hero-signal-pulse-delayed" />
        <text x="160" y="224" textAnchor="middle" className="hero-signal-caption">SPECIALIST REVIEW</text>
        <rect x="77" y="263" width="166" height="44" rx="8" className="hero-signal-node" />
        <text x="160" y="290" textAnchor="middle" className="hero-signal-label">Findings + next steps</text>
      </svg>
      <p className="mt-3 text-center font-mono text-[10px] tracking-wide text-ink-muted">YOUR CONTEXT · YOUR REVIEW · YOUR CALL</p>
    </div>
  );
}
