export default function MarketingHome() {
  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col justify-center gap-4 px-6 py-16">
      <p className="text-sm tracking-wide text-zinc-500">SkaleAgents</p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
        AI DevOps control plane
      </h1>
      <p className="text-lg text-zinc-600">
        Build, ship, and operate agent swarms with a single control surface.
      </p>
      <a
        className="inline-flex w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        href={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
      >
        Open app
      </a>
    </main>
  );
}
