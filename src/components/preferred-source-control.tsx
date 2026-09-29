"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const publisherScript = "https://news.google.com/swg/js/v1/publisher.js";

function loadPublisherScript() {
  if (document.querySelector(`script[src="${publisherScript}"]`)) return;

  const script = document.createElement("script");
  script.src = publisherScript;
  script.async = true;
  document.head.append(script);
}

export function PreferredSourceControl() {
  const control = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/workspace-invitations/accept") {
      loadPublisherScript();
      return;
    }

    const element = control.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      loadPublisherScript();
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      loadPublisherScript();
      observer.disconnect();
    }, { rootMargin: "400px 0px" });

    observer.observe(element);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <div
      ref={control}
      className="google-add-preferred-source-btn mb-5"
      google-add-preferred-source-btn=""
    />
  );
}
