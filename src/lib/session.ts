import { QueryClient, queryOptions } from "@tanstack/react-query";
import { apiFetch, ApiError, type ApiUser } from "@/lib/api";

export const currentUserOptions = queryOptions({
  queryKey: ["user"],
  queryFn: async ({ signal }): Promise<ApiUser | null> => {
    try {
      return await apiFetch<ApiUser>("/api/user", { signal });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  staleTime: 45_000,
  refetchOnWindowFocus: true,
});

export async function setSessionUser(client: QueryClient, user: ApiUser | null) {
  // Cancel first so late responses cannot restore the previous account's cache.
  await client.cancelQueries();
  client.clear();
  client.setQueryData(currentUserOptions.queryKey, user);
}
