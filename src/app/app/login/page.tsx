"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  apiFetch,
  ensureCsrfCookie,
  type AuthSession,
} from "@/lib/api";
import { Button, FieldLabel, TextInput } from "@/components/ui";

const schema = z.object({
  code: z.string().min(1, "Enter a mock code"),
  displayName: z.string().min(1, "Enter a display name"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "demo", displayName: "Rayhan" },
  });

  const login = useMutation({
    mutationFn: async (values: FormValues) => {
      await ensureCsrfCookie();
      return apiFetch<AuthSession>("/api/auth/grok/callback", {
        method: "POST",
        body: JSON.stringify(values),
      });
    },
    onSuccess: (session) => {
      queryClient.setQueryData(["user"], session.user);
      toast.success(`Signed in as ${session.user.displayName}`);
      router.push("/app");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <main className="relative -mx-6 -my-8 flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(720px 360px at 18% -8%, var(--accent-soft), transparent 58%),
            repeating-linear-gradient(
              -18deg,
              transparent,
              transparent 11px,
              color-mix(in srgb, var(--line) 55%, transparent) 11px,
              color-mix(in srgb, var(--line) 55%, transparent) 12px
            )
          `,
        }}
      />

      <div className="motion-enter relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <p className="font-display text-sm font-semibold tracking-[0.14em] text-accent uppercase">
          SkaleAgents
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Sign in with Grok Bot
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          Link your session to publish bots, manage prompts, and mint API tokens
          for MCP.
        </p>

        <form
          className="mt-8 space-y-5 rounded-[10px] border border-line bg-canvas-elevated/90 p-6 backdrop-blur-sm"
          style={{
            boxShadow:
              "0 1px 0 color-mix(in srgb, var(--line) 80%, transparent)",
          }}
          onSubmit={form.handleSubmit((values) => login.mutate(values))}
        >
          <p className="font-mono text-xs tracking-wide text-ink-muted uppercase">
            Mock provider · any non-empty code
          </p>

          <label className="block space-y-1.5">
            <FieldLabel>Mock code</FieldLabel>
            <TextInput
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              {...form.register("code")}
            />
            {form.formState.errors.code && (
              <span className="text-sm text-danger">
                {form.formState.errors.code.message}
              </span>
            )}
          </label>

          <label className="block space-y-1.5">
            <FieldLabel>Display name</FieldLabel>
            <TextInput autoComplete="nickname" {...form.register("displayName")} />
            {form.formState.errors.displayName && (
              <span className="text-sm text-danger">
                {form.formState.errors.displayName.message}
              </span>
            )}
          </label>

          <Button
            type="submit"
            disabled={login.isPending}
            className="w-full py-2.5"
          >
            {login.isPending ? "Signing in…" : "Continue"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-ink-muted">
          Just browsing?{" "}
          <Link href="/app/bots" className="font-medium text-ink underline-offset-2 hover:underline">
            Open the bot directory
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
