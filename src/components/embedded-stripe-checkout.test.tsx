import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { loadStripe } from "@stripe/stripe-js/pure";
import { EmbeddedStripeCheckout } from "./embedded-stripe-checkout";

vi.mock("@stripe/stripe-js/pure", () => ({ loadStripe: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

it("mounts Stripe with the server session and destroys it when leaving the organization", async () => {
  const mount = vi.fn(); const destroy = vi.fn(); const complete = vi.fn();
  const createEmbeddedCheckoutPage = vi.fn().mockResolvedValue({ mount, destroy });
  vi.mocked(loadStripe).mockResolvedValue({ createEmbeddedCheckoutPage } as never);
  const view = render(<EmbeddedStripeCheckout clientSecret="cs_test_fixture_secret_fixture" publishableKey="pk_test_fixture" onComplete={complete} />);
  await waitFor(() => expect(mount).toHaveBeenCalledOnce());
  expect(createEmbeddedCheckoutPage).toHaveBeenCalledWith(expect.objectContaining({ clientSecret: "cs_test_fixture_secret_fixture" }));
  act(() => createEmbeddedCheckoutPage.mock.calls[0][0].onComplete());
  expect(complete).toHaveBeenCalledOnce();
  view.unmount(); expect(destroy).toHaveBeenCalledOnce();
});

it("destroys initialization that finishes after the organization view unmounts", async () => {
  let finish!: (value: unknown) => void;
  const mount = vi.fn(); const destroy = vi.fn();
  vi.mocked(loadStripe).mockResolvedValue({ createEmbeddedCheckoutPage: () => new Promise(resolve => { finish = resolve; }) } as never);
  const view = render(<EmbeddedStripeCheckout clientSecret="cs_test_fixture_secret_fixture" publishableKey="pk_test_fixture" onComplete={vi.fn()} />);
  await waitFor(() => expect(finish).toBeTypeOf("function"));
  view.unmount();
  await act(async () => { finish({ mount, destroy }); });
  expect(mount).not.toHaveBeenCalled(); expect(destroy).toHaveBeenCalledOnce();
});

it("shows a safe failure instead of leaking a Stripe error or client secret", async () => {
  vi.mocked(loadStripe).mockRejectedValue(new Error("secret-provider-details"));
  render(<EmbeddedStripeCheckout clientSecret="cs_test_fixture_secret_fixture" publishableKey="pk_test_fixture" onComplete={vi.fn()} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load the payment form");
  expect(screen.queryByText(/secret-provider-details/)).not.toBeInTheDocument();
});
