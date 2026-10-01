// Cloudflare sets CF-IPCountry. Cookie consent is limited to the places with a
// European cookie-consent rule: the EEA, the United Kingdom, and Switzerland.
const EUROPEAN_COOKIE_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "IS", "LI", "NO",
  "GB", "UK", "CH",
]);

export function cookieConsentRequired(country: string | null | undefined) {
  if (!country) return false;
  return EUROPEAN_COOKIE_COUNTRIES.has(country.trim().toUpperCase());
}
