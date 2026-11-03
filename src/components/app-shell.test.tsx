import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/blog", useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

afterEach(cleanup);

function Counter() {
  const [count, setCount] = useState(0);
  return <button type="button" onClick={() => setCount(count + 1)}>clicked {count}</button>;
}

it("keeps page state through the first session result but resets it on every later identity change", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } });
  render(<QueryClientProvider client={client}><AppShell publicFooter={null}><Counter /></AppShell></QueryClientProvider>);
  const press = () => act(() => screen.getByRole("button", { name: /clicked/ }).click());
  // React Query notifies observers on a setTimeout(0) tick.
  const signIn = (user: { id: string; displayName: string } | null) => act(async () => {
    client.setQueryData(["user"], user);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  press();
  await signIn({ id: "account-a", displayName: "A" });
  expect(screen.getByRole("button", { name: /clicked/ }).textContent).toBe("clicked 1");

  press();
  await signIn({ id: "account-b", displayName: "B" });
  expect(screen.getByRole("button", { name: /clicked/ }).textContent).toBe("clicked 0");

  // A -> B -> signed out -> C -> signed out: each step starts clean, including repeated sign-outs.
  for (const next of [null, { id: "account-c", displayName: "C" }, null]) {
    press();
    await signIn(next);
    expect(screen.getByRole("button", { name: /clicked/ }).textContent).toBe("clicked 0");
  }
});
