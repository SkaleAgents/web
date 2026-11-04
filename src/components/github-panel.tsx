"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Select } from "@/components/ui";
import { useGithubInstallation } from "@/components/github-scan-button";
import { apiFetch, ApiError, ensureCsrfCookie } from "@/lib/api";
import { personalDestinationFromPath } from "@/lib/dashboard-routes";
import { githubErrorMessage, githubRef, needsUpgrade, SUSPENDED_MESSAGE, type GithubRepositoryPage } from "@/lib/github";

/** Repository and branch pickers. Reports the chosen `github:owner/repo@branch` reference, or null until both are chosen. */
export function GithubPanel({ onRef, onClose }: { onRef: (ref: string | null) => void; onClose: () => void }) {
  const billing = personalDestinationFromPath(usePathname(), "billing");
  const queryClient = useQueryClient();
  const installation = useGithubInstallation(true);
  const usable = installation.data?.connected === true && !installation.data.suspended;
  const [repoId, setRepoId] = useState("");
  const [branchChoice, setBranchChoice] = useState("");
  const repos = useInfiniteQuery({
    queryKey: ["github-repositories"],
    enabled: usable,
    retry: false,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => apiFetch<GithubRepositoryPage>(`/api/github/repositories?page=${pageParam}`, { signal }),
    getNextPageParam: (last) => last.nextPage ?? undefined,
  });
  const repositories = repos.data?.pages.flatMap((page) => page.repositories) ?? [];
  const repo = repositories.find((item) => String(item.id) === repoId);
  const branches = useQuery({
    queryKey: ["github-branches", repoId],
    enabled: usable && Boolean(repo),
    retry: false,
    queryFn: ({ signal }) => apiFetch<{ branches: string[] }>(`/api/github/repositories/${repoId}/branches`, { signal }),
  });
  const names = branches.data?.branches ?? [];
  const branch = names.includes(branchChoice) ? branchChoice : repo && names.includes(repo.defaultBranch) ? repo.defaultBranch : names[0] ?? "";
  const ref = repo && branch ? githubRef(repo.fullName, branch) : null;
  useEffect(() => { onRef(ref); }, [ref, onRef]);
  const disconnect = useMutation({
    mutationFn: async () => { await ensureCsrfCookie(); await apiFetch("/api/github/installation", { method: "DELETE" }); },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["github-installation"] }); onClose(); },
  });
  const failure = [installation.error, repos.error, branches.error].find(Boolean);
  const suspended = installation.data?.suspended || (failure instanceof ApiError && failure.code === "github_suspended");
  const notConnected = installation.data?.connected === false || (failure instanceof ApiError && failure.code === "github_not_connected");

  return <div className="space-y-3" aria-label="GitHub repository">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-ink-muted">{installation.data?.accountLogin ? `Connected as ${installation.data.accountLogin}.` : "Pick a repository and branch."}</p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Paste or upload instead</Button>
        <Button type="button" variant="ghost" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>Disconnect GitHub</Button>
      </div>
    </div>
    {suspended && <p role="alert" className="text-sm text-danger">{SUSPENDED_MESSAGE}</p>}
    {notConnected && <p role="alert" className="text-sm text-danger">{githubErrorMessage(new ApiError("", 409, [], "github_not_connected"))}</p>}
    {failure && !suspended && !notConnected && <p role="alert" className="text-sm text-danger">{githubErrorMessage(failure)} {needsUpgrade(failure) && <Link href={billing} className="underline">Upgrade</Link>}</p>}
    {disconnect.isError && <p role="alert" className="text-sm text-danger">{githubErrorMessage(disconnect.error)}</p>}
    {usable && <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="block text-sm text-ink-muted">Repository
          <Select className="mt-1" value={repoId} onChange={(event) => { setRepoId(event.target.value); setBranchChoice(""); }}>
          <option value="">{repos.isPending ? "Loading…" : "Choose a repository"}</option>
          {repositories.map((item) => <option key={item.id} value={item.id}>{item.fullName}{item.private ? " (private)" : ""}</option>)}
          </Select>
        </label>
        {repos.hasNextPage && <Button type="button" variant="ghost" className="mt-1" disabled={repos.isFetchingNextPage} onClick={() => void repos.fetchNextPage()}>{repos.isFetchingNextPage ? "Loading…" : "Load more"}</Button>}
      </div>
      <label className="block text-sm text-ink-muted">Branch
        <Select className="mt-1" value={branch} disabled={!repo || branches.isPending} onChange={(event) => setBranchChoice(event.target.value)}>
          {names.length === 0 && <option value="">{repo ? "Loading…" : "Choose a repository first"}</option>}
          {names.map((name) => <option key={name} value={name}>{name}</option>)}
        </Select>
      </label>
    </div>}
  </div>;
}
