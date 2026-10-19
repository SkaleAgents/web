import { afterEach, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { addPasskey } from "@/lib/email-auth";
import { finishAccountSetup, passkeyNameFrom } from "./account-setup";

vi.mock("@/lib/api", async (load) => ({ ...(await load<typeof import("@/lib/api")>()), apiFetch: vi.fn() }));
vi.mock("@/lib/account-agreement", () => ({ readAgreement: vi.fn(async () => ({ required: false })), acceptAgreement: vi.fn() }));
vi.mock("@/lib/email-auth", async (load) => ({ ...(await load<typeof import("@/lib/email-auth")>()), addPasskey: vi.fn(), deviceName: () => "macOS passkey" }));

afterEach(() => vi.clearAllMocks());

it("reads the passkey name from the form", () => {
  const form = document.createElement("form");
  form.innerHTML = '<input name="passkeyName" value="Work laptop">';
  expect(passkeyNameFrom(form)).toBe("Work laptop");
  expect(passkeyNameFrom(null)).toBe("");
});

it("names the passkey, falling back to the device", async () => {
  vi.mocked(apiFetch).mockResolvedValue({ accountId: "u1", passkeys: [] } as never);
  await finishAccountSetup("u1", true, "  Work laptop ");
  await finishAccountSetup("u1", true, "   ");
  expect(vi.mocked(addPasskey).mock.calls).toEqual([["u1", "Work laptop"], ["u1", "macOS passkey"]]);
});

it("skips the passkey when declined or one already exists", async () => {
  await finishAccountSetup("u1", false, "x");
  vi.mocked(apiFetch).mockResolvedValue({ accountId: "u1", passkeys: [{ id: "p1" }] } as never);
  await finishAccountSetup("u1", true, "x");
  expect(addPasskey).not.toHaveBeenCalled();
});
