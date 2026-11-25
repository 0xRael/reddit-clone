import { createClient } from "@/utils/supabase/component";
import type { Notification } from "@/types";
import { getAuthUserId } from "@/utils/queries/users";

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
