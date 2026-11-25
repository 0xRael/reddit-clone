import { createClient } from "@/utils/supabase/component";
import type { Reply } from "@/types";
import { resolveMentionsToTokens } from "@/utils/mentions";
import { getAuthUserId } from "@/utils/queries/users";
import { getCached, invalidateCacheByPrefix } from "@/utils/cache";

const REPLIES_TTL_MS = 20 * 1000; // 20 seconds debounce window

export async function getPostReplies(
  postId: string
): Promise<{ data: Reply[]; error: string | null }> {
  const cacheKey = `replies:post:${postId}`;

  const result = await getCached(cacheKey, REPLIES_TTL_MS, async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("replies")
      .select(`
        *,
        users (
          username
        ),
        reply_votes_view (
          upvotes,
          downvotes
        )
      `)
      .eq("post_id", postId);

    return {
      data: (data ?? []) as Reply[],
      error: error ? error.message : null,
    };
  });

  if (result.error) {
    invalidateCacheByPrefix(cacheKey);
  }

  return result;
}

export async function insertReply(
  postId: string,
  text: string,
  parentReplyId: string | null = null
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { error: "User not Authenticated." };
  }

  const supabase = createClient();
  const formattedText = await resolveMentionsToTokens(text);

  const { error } = await supabase.from("replies").insert({
    text: formattedText,
    user_id: userId,
    post_id: postId,
    reply_id: parentReplyId,
  });

  if (!error) {
    invalidateCacheByPrefix(`replies:post:${postId}`);
    invalidateCacheByPrefix(`post:id:${postId}`);
    invalidateCacheByPrefix("posts-query:");
  }

  return { error: error ? error.message : null };
}

export async function updateReply(
  replyId: string,
  newText: string
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { error: "User not Authenticated." };
  }

  const supabase = createClient();
  const formattedText = await resolveMentionsToTokens(newText);

  const { error } = await supabase
    .from("replies")
    .update({ text: formattedText })
    .eq("id", replyId)
    .eq("user_id", userId);

  if (!error) {
    invalidateCacheByPrefix("replies:post:");
  }

  return { error: error ? error.message : null };
}

export async function deleteReply(
  replyId: string
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { error: "User not Authenticated." };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("replies")
    .delete()
    .eq("id", replyId)
    .eq("user_id", userId);

  if (!error) {
    invalidateCacheByPrefix("replies:post:");
    invalidateCacheByPrefix("posts-query:");
  }

  return { error: error ? error.message : null };
}

export type { Reply };
