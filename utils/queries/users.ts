import { createClient } from "@/utils/supabase/component";
import type { User } from "@/types";
import { getCached, invalidateCacheByPrefix, readCache, writeCache } from "@/utils/cache";

const USER_TTL_MS = 30 * 60 * 1000; // 5 minutes

export async function getAuthUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return null;
  }

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
  const cacheKey = `user:${field}:${queryId}`;

  const result = await getCached(cacheKey, USER_TTL_MS, async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq(field, queryId)
      .maybeSingle<User>();

    return {
      data,
      error: error ? error.message : null,
    };
  });

  if (result.error) {
    invalidateCacheByPrefix(cacheKey);
  }

  return result;
}

export async function getListOfUsers(
  userIds: string[],
  match?: string
): Promise<{ data: User[]; error: string | null }> {
  if (userIds.length === 0) {
    return { data: [], error: null };
  }

  const field = match ?? "id";
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return { data: [], error: null };
  }

  const usersByKey = new Map<string, User>();
  const missingIds: string[] = [];

  // 1. Walk through the cache first and collect every found user
  for (const id of uniqueIds) {
    const cacheKey = `user:${field}:${id}`;
    const cachedUser = readCache<User | null>(cacheKey);

    if (cachedUser !== undefined && cachedUser !== null) {
      const mapKey = field === "username" ? cachedUser.username : cachedUser.id;
      usersByKey.set(mapKey, cachedUser);
    } else {
      missingIds.push(id);
    }
  }

  // 2. Query only the missing users in a single batch query
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
      const fetchedUsers = (data ?? []) as User[];

      // 3. Cache all fetched users individually
      for (const user of fetchedUsers) {
        const keyValue = field === "username" ? user.username : user.id;
        writeCache(`user:${field}:${keyValue}`, user, USER_TTL_MS);
        usersByKey.set(keyValue, user);
      }
    }
  }

  // Preserve requested order
  const orderedUsers: User[] = [];
  for (const id of uniqueIds) {
    const found = usersByKey.get(id);
    if (found) {
      orderedUsers.push(found);
    }
  }

  return {
    data: orderedUsers,
    error: queryError,
  };
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

  if (!error) {
    invalidateCacheByPrefix(`user:id:${userId}`);
  }

  return { error: error ? error.message : null };
}

export type { User };
