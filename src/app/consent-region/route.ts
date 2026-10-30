import { cookieConsentRequired } from "@/lib/cookie-consent-region";

// Read per request so the HTML pages around it can stay static and cacheable.
export function GET(request: Request) {
  return Response.json(
    { required: cookieConsentRequired(request.headers.get("cf-ipcountry")) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
