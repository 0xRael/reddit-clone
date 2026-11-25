import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/component";
import type { Notification } from "@/types";
import { getAuthUserId } from "@/utils/queries/users";
import { STALE_TIMES } from "@/utils/queryTimings";

export async function getNotifications(): Promise<{
  data: Notification[];
  error: string | null;
}> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { data: [], error: "User is not Authenticated." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id,
      type,
      reply_id,
      post_id,
      created_at,
      read,
      actor:actor_id ( username ),
      reply:reply_id (
        id,
        text,
        post_id
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return {
    data: (data as unknown as Notification[]) ?? [],
    error: error ? error.message : null,
  };
}

export async function markAllNotificationsAsRead(): Promise<{
  error: string | null;
}> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { error: "User is not Authenticated." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  return { error: error ? error.message : null };
}

export async function getUnreadNotificationsCount(
  targetUserId?: string | null
): Promise<{ count: number; error: string | null }> {
  const userId = targetUserId ?? (await getAuthUserId());
  if (!userId) {
    return { count: 0, error: null };
  }

    const supabase = createClient();
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    return {
      count: typeof count === "number" ? count : 0,
      error: error ? error.message : null,
    };
}

// QUERY OPTIONS

export const notificationsQueryOptions = () =>
  queryOptions({
    queryKey: ["notifications", "list"] as const,
    staleTime: STALE_TIMES.notifications,
    queryFn: async () => {
      const { data, error } = await getNotifications();
      if (error) throw new Error(error);
      return data;
    },
  });

export const unreadNotificationsCountQueryOptions = (
  targetUserId?: string | null
) =>
  queryOptions({
    queryKey: ["notifications", "unread", targetUserId ?? "current"] as const,
    staleTime: STALE_TIMES.notifications,
    queryFn: async () => {
      const { count, error } = await getUnreadNotificationsCount(targetUserId);
      if (error) throw new Error(error);
      return count;
    },
  });
