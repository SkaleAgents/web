import { expect, it } from "vitest";
import { cookieConsentRequired } from "./cookie-consent-region";

it("asks for cookie consent in the EEA, the UK, and Switzerland", () => {
  for (const country of ["DE", "fr", "IS", "NO", "GB", "UK", "CH"]) {
    expect(cookieConsentRequired(country)).toBe(true);
  }
});

it("skips cookie consent outside Europe and when the country is unknown", () => {
  for (const country of ["US", "IN", "JP", "AU", "BR", "XX", "T1", "", null, undefined]) {
    expect(cookieConsentRequired(country)).toBe(false);
  }
});
