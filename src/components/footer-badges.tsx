"use client";

import { directoryBadgeEntries, directoryLinks } from "@/components/footer-badges-data";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function BadgeImage({ name, src, width, height, alt, loading = "lazy", decoding = "async", imageStyle }: { name: string; src: string | null; width?: number; height?: number; alt?: string; loading?: "eager" | "lazy" | null; decoding?: "async" | "auto" | "sync" | null; imageStyle?: CSSProperties }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <span className="footer-badge-fallback">{name}</span>;

  // Remote directory badges include SVGs and dynamic endpoints; retain their original URLs.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt ?? `Listed on ${name}`} width={width} height={height} loading={loading ?? undefined} decoding={decoding ?? undefined} style={imageStyle} onError={() => setFailed(true)} />;
}

function AgentHunterBadge() {
  const [failed, setFailed] = useState(false);

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8, boxSizing: "border-box", width: "100%", height: "100%", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", padding: "2px 6px 2px 2px", color: "#111827" }}>
      {failed ? (
        <span style={{ display: "inline-flex", flex: "0 0 34px", width: 34, height: 34, alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>AH</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="AgentHunter Badge" width={40} height={40} src="https://www.agenthunter.io/logo-light.svg" loading="lazy" decoding="async" onError={() => setFailed(true)} style={{ width: 34, height: 34, maxWidth: 34, flex: "0 0 34px", objectFit: "contain" }} />
      )}
      <span>
        <span style={{ display: "block", fontSize: 12, color: "#4b5563" }}>AgentHunter</span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#111827" }}>Featured AI Agent</span>
      </span>
    </span>
  );
}

function AInexfinderBadge() {
  const [failed, setFailed] = useState(false);

  return (
    <>
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "#fff" }}>Featured on</span>
      {failed ? (
        <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>AInexfinder</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="https://ainexfinder.com/brand/ainexfinder-logo-white.png"
          alt="AInexfinder AI Tools Directory"
          width={143}
          height={22}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          style={{ display: "block", height: 22, width: "auto" }}
          onError={() => setFailed(true)}
        />
      )}
    </>
  );
}

function BoworaBadge() {
  return (
    <>
      <svg width="35" height="35" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(31.1875, 18.1874)" fill="#000">
          <path d="M87.5343464,15.4046144 C88.0800499,16.2992254 87.7980596,17.4698555 86.9050901,18.0165331 C86.0121207,18.5633415 84.8423829,18.2806539 84.2966794,17.3859122 C81.7117678,13.1474282 78.0968081,9.80172458 73.4648555,7.33755659 L73.4485366,7.32879615 C68.8772902,4.83909213 63.5398394,3.61244746 57.444409,3.61244746 L9.3017365,3.61244746 C7.67506992,3.61244746 6.3960609,3.83953898 5.49238625,4.41819874 L5.45674581,4.4405444 C4.79524344,4.84409996 4.32995935,5.45833757 4.0239476,6.27503287 C3.73947677,7.26368123 3.60644521,8.42777375 3.60644521,9.76432926 L3.60644521,103.544841 C3.60644521,104.950303 3.75631787,106.263062 4.0658545,107.495669 C4.27578065,108.239391 4.6709588,108.810258 5.28428782,109.184211 L5.31979771,109.20657 C6.22347236,109.785151 7.50248138,110.012269 9.12927851,110.012269 L59.1699028,110.012269 C63.7602097,110.012269 68.0783175,109.267239 72.1226597,107.769727 C76.1497692,106.173758 79.6895314,103.98404 82.7378993,101.19469 C83.5107618,100.487317 84.7118318,100.541579 85.4181132,101.315897 C86.1243946,102.090216 86.0708687,103.293142 85.2967007,104.000384 C81.9088999,107.100795 77.9767011,109.539466 73.4985376,111.311429 L73.4602862,111.326073 C68.9979194,112.981273 64.2351545,113.8126 59.1699028,113.8126 L9.12927851,113.8126 C6.62504751,113.8126 4.6896276,113.307371 3.2936448,112.419559 C1.8549718,111.536324 0.878319095,110.227096 0.397499432,108.466901 L0.387969203,108.430944 C0.00649891912,106.918395 -0.1875,105.289999 -0.1875,103.544841 L-0.1875,9.76432926 C-0.1875,7.97589194 0.0187707215,6.42738608 0.409379582,5.11588281 L0.444889478,5.00826015 C1.06187393,3.31376875 2.08082518,2.0552073 3.46675555,1.20522233 C4.8626078,0.317842042 6.79815825,-0.1874 9.3017365,-0.1874 L57.444409,-0.1874 C64.2296714,-0.1874 70.1626962,1.21570871 75.252361,3.98591679 C80.5093922,6.78394907 84.5995579,10.5933023 87.5343464,15.4046144 Z" />
          <path d="M18.1870648,100.8126 C16.6872227,100.8126 15.520287,100.518396 14.687172,99.9299894 C13.9369898,99.4256779 13.4369118,98.6692106 13.1873299,97.6604566 C12.9372256,96.567738 12.8125,95.3909238 12.8125,94.130538 L12.8125,19.2423752 C12.8125,17.9815965 12.9372256,16.8888779 13.1873299,15.9647434 C13.5207588,14.9559894 14.0622378,14.1995221 14.8124201,13.6952106 C15.6459269,13.1068035 16.8124708,12.8126 18.3128353,12.8126 L53.1886048,12.8126 C57.8554332,12.8126 61.9387287,13.8632708 65.4386213,15.9647434 C69.0219693,18.066085 71.8139951,20.9235009 73.8135234,24.537515 C75.8135741,28.1519222 76.7720677,32.1020566 76.688482,36.3885735 C76.7720677,38.5740106 76.5218328,40.7170071 75.9382997,42.8183487 C75.3548972,44.9198213 74.4798587,46.8946265 73.3134454,48.7439434 C72.2298343,50.5090336 70.8552402,51.9800514 69.188096,53.1563416 C71.438251,54.5853115 73.3548465,56.4346284 74.9381438,58.7036372 C76.5213104,60.9731699 77.729386,63.4943345 78.5626316,66.2681788 C79.3971832,69.0416301 79.8125,71.9416177 79.8125,74.9670938 C79.7302203,78.5811079 79.0628402,81.9848831 77.8129717,85.1790743 C76.5631033,88.2891699 74.771364,91.0204424 72.4380151,93.3735468 C70.1045356,95.7271752 67.3963567,97.576361 64.3126949,98.9208424 C61.2291637,100.181752 57.9374518,100.8126 54.437559,100.8126 L18.186673,100.8126 L18.1870648,100.8126 Z" fillRule="nonzero" />
        </g>
      </svg>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <span style={{ fontSize: 10, fontWeight: "normal" }}>Featured on</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Bowora</span>
      </span>
    </>
  );
}

export function FooterBadges() {
  const slider = useRef<HTMLDivElement>(null);
  const [manual, setManual] = useState(false);
  const clientReady = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!manual) return;
    const resumeOutside = (event: PointerEvent) => {
      if (!slider.current?.contains(event.target as Node)) setManual(false);
    };
    document.addEventListener("pointerdown", resumeOutside);
    return () => document.removeEventListener("pointerdown", resumeOutside);
  }, [manual]);

  return (
    <div className="min-w-0 border-t border-line py-5">
      <div className="mb-3 text-xs text-ink-muted">
        <p className="font-medium">Find us on</p>
      </div>
      <div ref={slider} className="footer-badge-slider" role="region" aria-label="Directory badges" tabIndex={0} data-manual={manual} onMouseLeave={() => setManual(false)} onTouchStart={() => setManual(true)} onWheel={(event) => { if (event.deltaX !== 0) setManual(true); }}>
        <div className="footer-badge-track" style={clientReady ? undefined : { animation: "none" }}>
          {(clientReady ? [false, true] : [false]).map((duplicate) => (
            <div key={String(duplicate)} className="footer-badge-group" aria-hidden={duplicate ? true : undefined}>
              {directoryBadgeEntries.map((badge) => (
                <a key={badge.href} href={badge.href} target="_blank" rel={badge.rel} title={badge.title} aria-label={badge.ariaLabel} tabIndex={duplicate ? -1 : undefined} style={badge.variant === "bowora" ? { display: "inline-flex", alignItems: "center", gap: 10, width: 170, height: 50, backgroundColor: "#fff", color: "#000", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", padding: "8px 14px", borderRadius: 8, textDecoration: "none", border: "1px solid #E8E8E8" } : badge.variant === "ainexfinder" ? { display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#7150E6", border: "1px solid #6347D1", borderRadius: 10, textDecoration: "none", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif", lineHeight: 1 } : { width: badge.displayWidth }} data-topaitools4u-badge={badge.name === "TopAITools4U" ? "verified-listing" : undefined}>
                  {badge.variant === "agenthunter" ? <AgentHunterBadge /> : badge.variant === "ainexfinder" ? <AInexfinderBadge /> : badge.variant === "bowora" ? <BoworaBadge /> : <BadgeImage name={badge.name} src={badge.src} width={badge.width} height={badge.height} alt={badge.alt} loading={badge.loading} decoding={badge.decoding} imageStyle={badge.imageStyle} />}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-ink-muted">
        {directoryLinks.map(([name, href, rel = "noopener noreferrer"]) => <a key={href} href={href} target="_blank" rel={rel} className="hover:text-ink hover:underline">{name}</a>)}
      </div>
    </div>
  );
}
