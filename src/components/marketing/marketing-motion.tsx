"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function MarketingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches || !root.current || !("IntersectionObserver" in window)) return;

    const animations = new Set<Animation>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (preference.matches || entry.boundingClientRect.top < 0 || entry.target.contains(document.activeElement)) continue;
        const animation = entry.target.animate(
          [{ opacity: 0.35, transform: "translateY(24px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 650, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        );
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      }
    }, { threshold: 0.08 });

    root.current.querySelectorAll(".marketing-section").forEach((section) => observer.observe(section));
    function onPreferenceChange() {
      if (preference.matches) {
        observer.disconnect();
        animations.forEach((animation) => animation.cancel());
      }
    }
    preference.addEventListener("change", onPreferenceChange);
    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      preference.removeEventListener("change", onPreferenceChange);
    };
  }, []);

  return <main ref={root} className="marketing-home">{children}</main>;
}
