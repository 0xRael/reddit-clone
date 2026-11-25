import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/component";
import { getAuthUserId } from "@/utils/queries/users";
import { STALE_TIMES } from "@/utils/queryTimings";

export async function performPostVote(
  postId: string,
  voteType: number
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { error: "User not Authenticated." };
  }

  const supabase = createClient();

  const { error } = await supabase.from("vote").upsert(
    {
      user_id: userId,
      post_id: postId,
      type: voteType,
    },
    { onConflict: "user_id,post_id" }
  );

  return { error: error ? error.message : null };
}

export async function performReplyVote(
  replyId: string,
  voteType: number
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { error: "User not Authenticated." };
  }

  const supabase = createClient();

  const { error } = await supabase.from("vote").upsert(
    {
      user_id: userId,
      reply_id: replyId,
      type: voteType,
    },
    { onConflict: "user_id,reply_id" }
  );

  return { error: error ? error.message : null };
}

export async function getUserPostVote(
  postId: string,
  userId?: string | null
): Promise<number | null> {
  const queryId = userId ?? (await getAuthUserId());
  if (!queryId) return null;

    const supabase = createClient();
    const { data } = await supabase
      .from("vote")
      .select("type")
      .eq("user_id", queryId)
      .eq("post_id", postId)
      .maybeSingle();

    return data?.type ?? null;
}

export async function getUserReplyVotes(
  replyIds: string[],
  userId?: string | null
): Promise<Record<string, number>> {
  const queryId = userId ?? (await getAuthUserId());
  if (!queryId || replyIds.length === 0) return {};

  const sortedIds = Array.from(new Set(replyIds.filter(Boolean))).sort();
  if (sortedIds.length === 0) return {};

    const supabase = createClient();
    const { data } = await supabase
      .from("vote")
      .select("reply_id, type")
      .eq("user_id", queryId)
      .in("reply_id", sortedIds);

    const replyVoteMap: Record<string, number> = {};
    for (const row of data ?? []) {
      if (row.reply_id) {
        replyVoteMap[row.reply_id] = row.type;
      }
    }
    return replyVoteMap;
}

// QUERY OPTIONS

export const userPostVoteQueryOptions = (
  postId: string | null | undefined,
  userId?: string | null
) =>
  queryOptions({
    queryKey: ["votes", "post", userId ?? "current", postId] as const,
    enabled: Boolean(postId),
    staleTime: STALE_TIMES.votes,
    queryFn: () => getUserPostVote(postId!, userId),
  });

export const userReplyVotesQueryOptions = (
  replyIds: readonly string[],
  userId?: string | null
) => {
  const sortedIds = Array.from(new Set(replyIds.filter(Boolean))).sort();

  return queryOptions({
    queryKey: ["votes", "replies", userId ?? "current", sortedIds] as const,
    enabled: sortedIds.length > 0,
    staleTime: STALE_TIMES.votes,
    queryFn: () => getUserReplyVotes(sortedIds, userId),
  });
};
