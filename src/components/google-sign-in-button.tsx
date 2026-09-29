"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ensureCsrfCookie, googleSignInHref, type AuthSession } from "@/lib/api";
import { GoogleSignInLabel } from "@/components/google-mark";
import { Button, LinkButton } from "@/components/ui";
import { setSessionUser } from "@/lib/session";

export function GoogleSignInButton() {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH_ENABLED === "true") {
    return <MockGoogleSignInButton />;
  }

  return (
    <LinkButton href={googleSignInHref()} className="px-3 py-1.5">
      <GoogleSignInLabel>Sign in with Google</GoogleSignInLabel>
    </LinkButton>
  );
}

function MockGoogleSignInButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const login = useMutation({
    mutationFn: async () => {
      await ensureCsrfCookie();
      return apiFetch<AuthSession>("/api/auth/google/callback", {
        method: "POST",
        body: JSON.stringify({
          code: "demo-google",
          displayName: "Rayhan",
          email: "rayhan@example.com",
        }),
      });
    },
    onSuccess: async (session) => {
      await setSessionUser(queryClient, session.user);
      toast.success(`Signed in as ${session.user.displayName}`);
      router.push("/me");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Button type="button" className="px-3 py-1.5" disabled={login.isPending} onClick={() => login.mutate()}>
      <GoogleSignInLabel>{login.isPending ? "Signing in…" : "Sign in with Google"}</GoogleSignInLabel>
    </Button>
  );
}
