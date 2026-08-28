export default function AppHome() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-4 px-6 py-12">
      <p className="text-sm text-zinc-500">app</p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        SkaleAgents
      </h1>
      <p className="text-zinc-600">
        Product shell scaffold. Auth and bot directory come next — API at{" "}
        <code className="rounded bg-zinc-100 px-1 text-sm">
          {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost"}
        </code>
        .
      </p>
    </main>
  );
}
