import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PreferredSourceControl } from "./preferred-source-control";

const publisherScript = "https://news.google.com/swg/js/v1/publisher.js";

class TestIntersectionObserver {
  static instance: TestIntersectionObserver | undefined;
  readonly observe = vi.fn();
  readonly disconnect = vi.fn();
  readonly unobserve = vi.fn();
  readonly root = null;
  readonly rootMargin = "400px 0px";
  readonly thresholds = [0];

  constructor(private readonly callback: IntersectionObserverCallback) {
    TestIntersectionObserver.instance = this;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  enter(target: Element) {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

describe("PreferredSourceControl", () => {
  beforeEach(() => {
    TestIntersectionObserver.instance = undefined;
    vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);
  });

  afterEach(() => {
    cleanup();
    document.querySelectorAll(`script[src="${publisherScript}"]`).forEach((script) => script.remove());
    vi.unstubAllGlobals();
  });

  it("waits until the footer control is near view and loads its script once", () => {
    const { container } = render(<PreferredSourceControl />);
    const control = container.querySelector("[google-add-preferred-source-btn]");

    expect(control).not.toBeNull();
    expect(TestIntersectionObserver.instance?.observe).toHaveBeenCalledWith(control);
    expect(document.querySelector(`script[src="${publisherScript}"]`)).toBeNull();

    TestIntersectionObserver.instance?.enter(control!);

    const script = document.querySelector<HTMLScriptElement>(`script[src="${publisherScript}"]`);
    expect(script).not.toBeNull();
    expect(script?.async).toBe(true);
    expect(TestIntersectionObserver.instance?.disconnect).toHaveBeenCalledOnce();

    TestIntersectionObserver.instance?.enter(control!);
    expect(document.querySelectorAll(`script[src="${publisherScript}"]`)).toHaveLength(1);
  });
});
