"use client";

import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";

const FooterBadges = lazy(() => import("@/components/footer-badges").then((module) => ({ default: module.FooterBadges })));

export function DeferredFooterBadges({ fallback }: { fallback: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = root.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setReady(true), 0);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setReady(true);
        observer.disconnect();
      }
    }, { rootMargin: "400px 0px" });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={root} className="deferred-footer-badges">
      {ready ? <Suspense fallback={fallback}><FooterBadges /></Suspense> : fallback}
    </div>
  );
}
