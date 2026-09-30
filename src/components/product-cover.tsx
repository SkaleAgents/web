import Image from "next/image";
import type { CSSProperties } from "react";
import styles from "./product-cover.module.css";

type CoverProduct = { id: string; logo: string; tags: string[] };

function CoverIcon({ kind, size = 12 }: { kind: "check" | "terminal" | "arrow" | "activity"; size?: number }) {
  const paths = {
    check: "M20 6 9 17l-5-5",
    terminal: "M12 19h8M4 17l6-6-6-6",
    arrow: "M7 7h10v10M7 17 17 7",
    activity: "M22 12h-3l-3 8-6-16-3 8H2",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>;
}

function ProductVisual({ product }: { product: CoverProduct }) {
  if (product.id === "cloudploy") return <div className="product-visual visual-cloud" aria-hidden="true"><div className="mini-terminal"><div className="terminal-header"><span><i /><i /><i /></span><span>your next deployment</span><CoverIcon kind="terminal" size={12} /></div><div className="terminal-body"><span className="terminal-muted">~/my-next-big-thing</span><p><span className="terminal-blue">❯</span> deploy with cloudploy<span className="terminal-cursor">▌</span></p><span className="terminal-line"><CoverIcon kind="check" size={12} /> Connected to your cloud</span><span className="terminal-line"><CoverIcon kind="check" size={12} /> Built for your workflow</span><div className="deploy-pill"><span className="status-dot" /> From prompt to production <CoverIcon kind="arrow" size={12} /></div></div></div><span className="visual-caption mono">YOUR CLOUD. YOUR WORKFLOW.</span></div>
  if (product.id === "crontinel") return <div className="product-visual visual-monitor" aria-hidden="true"><div className="monitor-card"><div className="monitor-header"><CoverIcon kind="activity" size={17} /><span>Inside your application</span><span className="monitor-badge">DEMO</span></div>{["Scheduled jobs", "Queue workers", "Agent runs"].map((label, index) => <div className="monitor-row" key={label}><span>{label}</span><div className="heartbeat-bars">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ height: `${8 + ((i * 7 + index * 13) % 22)}px` }} />)}</div><span className="monitor-check"><CoverIcon kind="check" size={12} /></span></div>)}</div><span className="visual-caption mono">VISIBILITY BEYOND THE UPTIME CHECK.</span></div>
  if (product.id === "toolblip") return <div className="product-visual visual-tools" aria-hidden="true"><div className="tool-tiles">{["{ }", "Aa", "#", "↔", "</>", "◐"].map((symbol, i) => <span key={symbol} className={`tool-tile tile-${i}`}>{symbol}</span>)}</div><span className="visual-caption mono">OPEN A TAB. GET IT DONE.</span></div>
  return <div className={`product-visual visual-symbol visual-${product.id}`} aria-hidden="true"><div className="symbol-orbit" /><span className="product-large-symbol"><Image src={`/products/${product.logo}`} alt="" width={66} height={66} className={styles.logo} /></span><span className="symbol-small">{product.id === "amazingplugins" ? "Made for WooCommerce" : product.id === "appnary" ? "Made for Shopify" : product.id === "harun" ? "Notes from the work" : "From the lab"}</span><span className="visual-caption mono">{product.tags.join(" / ").toUpperCase()}</span></div>
}

// Artwork adapted from Binary Labs' product collection.
export function ProductCover({ id, logo, color }: { id: string; logo: string; color: string }) {
  const tags = id === "amazingplugins" ? ["WooCommerce", "WordPress", "Free plugins"]
    : id === "appnary" ? ["Shopify", "Pixel tracking", "E-commerce"]
    : ["Engineering", "Consulting", "Writing"];
  return <div className={styles.cover} style={{ "--product-color": color } as CSSProperties}>
    <ProductVisual product={{ id, logo, tags }} />
  </div>;
}
