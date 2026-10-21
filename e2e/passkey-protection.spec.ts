import { expect, test, type Page } from "./fixtures";

// Passkeys need a domain, not 127.0.0.1, so these pages load from localhost on the same server.
const origin = `http://localhost:${process.env.PLAYWRIGHT_PORT ?? 3100}`;
const user = { id: "alice", displayName: "Alice", email: "alice@example.com" };
const b64 = (text: string) => Buffer.from(text).toString("base64url");

async function virtualAuthenticator(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", { options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true } });
}

async function passkeyCreation(page: Page, saved: (name: string) => void) {
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/account/passkeys/options", route => route.fulfill({ json: { challengeId: "00000000-0000-4000-8000-000000000001", publicKey: {
    rp: { name: "SkaleAgents", id: "localhost" }, user: { id: b64(user.id), name: user.email, displayName: user.displayName },
    challenge: b64("challenge-0123456789abcdef"), pubKeyCredParams: [{ type: "public-key", alg: -7 }], timeout: 60000,
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
  } } }));
  await page.route("**/api/account/passkeys", route => {
    if (route.request().method() !== "POST") return route.fulfill({ json: { accountId: user.id, passkeys: [] } });
    expect(route.request().postDataJSON()).toMatchObject({ accountId: user.id, challengeId: "00000000-0000-4000-8000-000000000001" });
    saved(route.request().postDataJSON().name);
    return route.fulfill({ json: { accountId: user.id, passkeys: [{ id: "p1", name: "Passkey", created_at: "2026-10-17T00:00:00Z", last_used_at: null }] } });
  });
}

test("new accounts accept the terms and create a passkey in one step", async ({ page }) => {
  await virtualAuthenticator(page);
  let created = false, accepted = false;
  await passkeyCreation(page, () => { created = true; });
  await page.route("**/api/user", route => route.fulfill({ json: { ...user, agreementRequired: !accepted } }));
  await page.route("**/api/account/agreements", route => {
    if (route.request().method() === "POST") accepted = true;
    return route.fulfill({ json: { termsVersion: "2026-09-29", privacyVersion: "2026-09-29", required: !accepted } });
  });
  await page.goto(`${origin}/auth/agreements?next=%2Fdashboard%2Fsettings`);
  await expect(page.getByRole("heading", { name: "Finish setting up your account" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /Set up a passkey/ })).toBeChecked();
  await page.getByRole("checkbox", { name: /Terms of Service/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect.poll(() => created).toBe(true);
  expect(accepted).toBe(true);
  await expect(page).not.toHaveURL(/\/auth\/agreements/);
});

test("a protected action asks for a passkey, then retries", async ({ page }) => {
  await virtualAuthenticator(page);
  let deletes = 0, created = false;
  let savedName = "";
  await passkeyCreation(page, (name) => { created = true; savedName = name; });
  const listed = { accountId: user.id, passkeys: [{ id: "old", name: "Old laptop", created_at: "2026-10-01T00:00:00Z", last_used_at: null }] };
  await page.route("**/api/account/passkeys", route => route.request().method() === "GET" ? route.fulfill({ json: listed }) : route.fallback());
  await page.route("**/api/account/passkeys/old", route => {
    deletes++;
    return created ? route.fulfill({ json: { accountId: user.id, passkeys: [] } })
      : route.fulfill({ status: 403, json: { message: "Confirm with your passkey to continue.", code: "passkey_required", hasPasskey: false } });
  });
  await page.route("**/api/user", route => route.fulfill({ json: user }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { accountId: user.id, enabled: false } }));
  await page.route("**/api/account/notifications", route => route.fulfill({ json: { accountId: user.id, email: user.email, emailVerified: true, deliveryEnabled: true, preferences: { auditCompleted: true, auditFailed: true } } }));
  await page.goto(`${origin}/account/settings`);
  await page.getByRole("button", { name: "Remove Old laptop" }).click();
  const dialog = page.getByRole("dialog", { name: "Add a passkey to continue" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Passkey name").fill("Desk Mac");
  await dialog.getByRole("button", { name: "Add a passkey" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Passkey removed.")).toBeVisible();
  expect(created).toBe(true);
  expect(savedName).toBe("Desk Mac");
  expect(deletes).toBe(2);
});

test("cancelling the passkey check leaves the action undone", async ({ page }) => {
  let deletes = 0;
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/account/passkeys", route => route.fulfill({ json: { accountId: user.id, passkeys: [{ id: "old", name: "Old laptop", created_at: "2026-10-01T00:00:00Z", last_used_at: null }] } }));
  await page.route("**/api/account/passkeys/old", route => { deletes++; return route.fulfill({ status: 403, json: { message: "Confirm with your passkey to continue.", code: "passkey_required", hasPasskey: true } }); });
  await page.route("**/api/user", route => route.fulfill({ json: user }));
  await page.route("**/api/account/retention", route => route.fulfill({ json: { accountId: user.id, enabled: false } }));
  await page.route("**/api/account/notifications", route => route.fulfill({ json: { accountId: user.id, email: user.email, emailVerified: true, deliveryEnabled: true, preferences: { auditCompleted: true, auditFailed: true } } }));
  await page.goto(`${origin}/account/settings`);
  await page.getByRole("button", { name: "Remove Old laptop" }).click();
  const dialog = page.getByRole("dialog", { name: "Confirm it's you" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Passkey check cancelled." })).toBeVisible();
  expect(deletes).toBe(1);
});

test("passkeys can be named when added and renamed later", async ({ page }) => {
  await page.route("**/api/user", route => route.fulfill({ json: user }));
  let passkeys = [{ id: "00000000-0000-4000-8000-0000000000a1", name: "macOS passkey", created_at: "2026-10-01T00:00:00Z", last_used_at: null }];
  let renamed: unknown;
  await page.route("**/sanctum/csrf-cookie", route => route.fulfill({ status: 204 }));
  await page.route("**/api/account/passkeys", route => route.fulfill({ json: { accountId: user.id, passkeys } }));
  await page.route("**/api/account/passkeys/*-*", route => {
    renamed = route.request().postDataJSON();
    passkeys = [{ ...passkeys[0], name: "Work laptop" }];
    return route.fulfill({ json: { accountId: user.id, passkeys } });
  });
  await page.route("**/api/account/retention", route => route.fulfill({ json: { accountId: user.id, enabled: false } }));
  await page.route("**/api/account/notifications", route => route.fulfill({ json: { accountId: user.id, email: user.email, emailVerified: true, deliveryEnabled: true, preferences: { auditCompleted: true, auditFailed: true } } }));
  await page.goto("/account/settings");
  await page.getByRole("button", { name: "Rename macOS passkey" }).click();
  await page.getByLabel("New name for macOS passkey").fill("Work laptop");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Passkey renamed.")).toBeVisible();
  await expect(page.getByText("Work laptop")).toBeVisible();
  expect(renamed).toEqual({ accountId: user.id, name: "Work laptop" });
  // Adding asks for no name up front: the passkey is saved under the device name, then the new row opens for renaming.
  await expect(page.getByLabel("Passkey name")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add a passkey" })).toBeVisible();
});
