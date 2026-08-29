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
        <h1 className="text-2xl font-semibold tracking-tight">
          Sign in with Grok Bot
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Phase 1 mock OAuth — any non-empty code works.
        </p>
      </div>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => login.mutate(values))}
      >
        <label className="block space-y-1 text-sm">
          <span>Mock code</span>
          <input
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            {...form.register("code")}
          />
          {form.formState.errors.code && (
            <span className="text-red-600">
              {form.formState.errors.code.message}
            </span>
          )}
        </label>
        <label className="block space-y-1 text-sm">
          <span>Display name</span>
          <input
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            {...form.register("displayName")}
          />
          {form.formState.errors.displayName && (
            <span className="text-red-600">
              {form.formState.errors.displayName.message}
            </span>
          )}
        </label>
        <button
          type="submit"
          disabled={login.isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {login.isPending ? "Signing in…" : "Continue"}
        </button>
      </form>
    </main>
  );
}
