import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/component";
import type { User } from "@/types";
import { getQueryClient } from "@/components/QueryProvider";
import { STALE_TIMES } from "@/utils/queryTimings";

export async function getAuthUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) return null;
  return session?.user?.id ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUserId();
  return user !== null;
}

export async function getUser(
  userId?: string | null,
  match?: string
): Promise<{ data: User | null; error: string | null }> {
  const supabase = createClient();
  const queryId = userId ?? (await getAuthUserId());

  if (!queryId) {
    return { data: null, error: "User is not Authenticated." };
  }

  const field = match ?? "id";
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq(field, queryId)
    .maybeSingle<User>();

  return {
    data,
    error: error ? error.message : null,
  };
}

export async function getListOfUsers(
  userIds: string[],
  match?: string
): Promise<{ data: User[]; error: string | null }> {
  if (userIds.length === 0) return { data: [], error: null };

  const field = match ?? "id";
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return { data: [], error: null };

  const queryClient = getQueryClient();
  const usersByKey = new Map<string, User>();
  const missingIds: string[] = [];

  for (const id of uniqueIds) {
    const cached = queryClient.getQueryData<User | null | undefined>([
      "user",
      field,
      id,
    ]);
    if (cached !== null && cached !== undefined) {
      const mapKey = field === "username" ? cached.username : cached.id;
      usersByKey.set(mapKey, cached);
    } else {
      missingIds.push(id);
    }
  }

  let queryError: string | null = null;

  if (missingIds.length > 0) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .in(field, missingIds);

    if (error) {
      queryError = error.message;
    } else {
      for (const user of (data ?? []) as User[]) {
        const keyValue = field === "username" ? user.username : user.id;
        queryClient.setQueryData(["user", field, keyValue], user);
        usersByKey.set(keyValue, user);
      }
    }
  }

  const orderedUsers: User[] = [];
  for (const id of uniqueIds) {
    const found = usersByKey.get(id);
    if (found) orderedUsers.push(found);
  }

  return { data: orderedUsers, error: queryError };
}

export async function updateUsername(
  username: string
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) return { error: "User is not Authenticated." };

  const supabase = createClient();
  const { error } = await supabase
    .from("users")
    .update({ username: username.trim() })
    .eq("id", userId);

  return { error: error ? error.message : null };
}

// QUERY OPTIONS

export const authUserIdQueryOptions = () =>
  queryOptions({
    queryKey: ["auth", "userId"] as const,
    staleTime: STALE_TIMES.authSession,
    queryFn: getAuthUserId,
  });

export const isAuthenticatedQueryOptions = () =>
  queryOptions({
    queryKey: ["auth", "isAuthenticated"] as const,
    staleTime: STALE_TIMES.authSession,
    queryFn: isAuthenticated,
  });

export const userQueryOptions = (
  userId?: string | null,
  match?: string
) => {
  const field = match ?? "id";
  return queryOptions({
    queryKey: ["user", field, userId ?? "current"] as const,
    staleTime: STALE_TIMES.userProfile,
    queryFn: async () => {
      const { data, error } = await getUser(userId, field);
      if (error) throw new Error(error);
      return data;
    },
  });
};

export const usersListQueryOptions = (
  userIds: readonly string[],
  match?: string
) => {
  const field = match ?? "id";
  const sortedIds = Array.from(new Set(userIds.filter(Boolean))).sort();

  return queryOptions({
    queryKey: ["users", "list", field, sortedIds] as const,
    enabled: sortedIds.length > 0,
    staleTime: STALE_TIMES.userBatch,
    queryFn: async () => {
      const { data, error } = await getListOfUsers(sortedIds, field);
      if (error) throw new Error(error);
      return data;
    },
  });
};

export type { User };
