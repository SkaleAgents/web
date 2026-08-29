"use client";

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
    <main className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          Sign in with Grok Bot
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Phase 1 mock OAuth — any non-empty code works.
        </p>
      </div>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => login.mutate(values))}
      >
        <label className="block space-y-1">
          <FieldLabel>Mock code</FieldLabel>
          <TextInput {...form.register("code")} />
          {form.formState.errors.code && (
            <span className="text-sm text-danger">
              {form.formState.errors.code.message}
            </span>
          )}
        </label>
        <label className="block space-y-1">
          <FieldLabel>Display name</FieldLabel>
          <TextInput {...form.register("displayName")} />
          {form.formState.errors.displayName && (
            <span className="text-sm text-danger">
              {form.formState.errors.displayName.message}
            </span>
          )}
        </label>
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? "Signing in…" : "Continue"}
        </Button>
      </form>
    </main>
  );
}
