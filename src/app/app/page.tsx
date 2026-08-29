import Link from "next/link";

export default function AppHome() {
  return (
    <main className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">Home</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Soft client navigation + TanStack Query cache (Q25–Q26). Auth is mock
        Grok via Laravel Sanctum cookies.
      </p>
      <div className="flex gap-3 text-sm">
        <Link
          href="/app/login"
          className="rounded-md bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Sign in
        </Link>
        <Link
          href="/app/bots"
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600"
        >
          Bot directory
        </Link>
      </div>
    </main>
  );
}
