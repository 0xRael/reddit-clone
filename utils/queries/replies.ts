import { createClient } from "@/utils/supabase/component";
import type { Reply } from "@/types";
import { resolveMentionsToTokens } from "@/utils/mentions";
import { getAuthUserId } from "@/utils/queries/users";

export async function getPostReplies(
  postId: string
): Promise<{ data: Reply[]; error: string | null }> {
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
    data: data ?? [],
    error: error ? error.message : null,
  };
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

  return { error: error ? error.message : null };
}

export type { Reply };
