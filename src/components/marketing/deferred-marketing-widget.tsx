"use client";

import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";

const widgets = {
  examples: lazy(() => import("@/components/marketing/example-explorer").then((module) => ({ default: module.ExampleExplorer }))),
  sample: lazy(() => import("@/components/marketing/sample-review-demo").then((module) => ({ default: module.SampleReviewDemo }))),
  start: lazy(() => import("@/components/marketing/start-picker").then((module) => ({ default: module.StartPicker }))),
};

type WidgetName = keyof typeof widgets;

export function DeferredMarketingWidget({ name, fallback }: { name: WidgetName; fallback: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const Widget = widgets[name];

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const Observer = (window as unknown as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver;
    if (!Observer) {
      const timer = window.setTimeout(() => setReady(true), 0);
      return () => window.clearTimeout(timer);
    }

    const observer = new Observer(([entry]) => {
      if (entry.isIntersecting) {
        setReady(true);
        observer.disconnect();
      }
    }, { rootMargin: "300px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={root}>
      {ready ? <Suspense fallback={fallback}><Widget /></Suspense> : fallback}
    </div>
  );
}
