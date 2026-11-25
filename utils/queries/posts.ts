import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/component";
import type { Post } from "@/types";
import { resolveMentionsToTokens } from "@/utils/mentions";
import { getAuthUserId } from "@/utils/queries/users";
import { getQueryClient } from "@/components/QueryProvider";
import { STALE_TIMES } from "@/utils/queryTimings";

export async function updatePost(
  id: string,
  title: string,
  body?: string | null,
  communityId?: string | null,
  imageUrl?: string | null
): Promise<{ data: Post | null; error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) return { data: null, error: "User not Authenticated." };

  const supabase = createClient();
  const formattedText = body ? await resolveMentionsToTokens(body) : null;

  const { data, error } = await supabase
    .from("posts")
    .update({
      title: title.trim(),
      body: formattedText,
      community_id: communityId,
      image_url: imageUrl,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single<Post>();

  return { data, error: error ? error.message : null };
}

export async function insertPost(
  title: string,
  body?: string | null,
  communityId?: string | null,
  imageUrl?: string | null
): Promise<{ data: Post | null; error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) return { data: null, error: "User not Authenticated." };

  const supabase = createClient();
  const formattedText = body ? await resolveMentionsToTokens(body) : null;

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: title.trim(),
      body: formattedText,
      community_id: communityId,
      image_url: imageUrl,
      user_id: userId,
    })
    .select("*")
    .single<Post>();

  return { data, error: error ? error.message : null };
}

export async function getPost(
  id: string
): Promise<{ data: Post | null; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      users ( username ),
      communities ( name, icon_url, owner_id ),
      post_votes_view ( upvotes, downvotes ),
      post_replies_view ( count )
    `)
    .eq("id", id)
    .single<Post>();

  return { data, error: error ? error.message : null };
}

export async function deletePost(
  id: string,
  imageUrl?: string | null
): Promise<{ error: string | null }> {
  const supabase = createClient();

  if (imageUrl) {
    const filePath = imageUrl.split("/post_images/")[1];
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from("post_images")
        .remove([filePath]);
      if (storageError) {
        console.error("Failed to delete image from storage:", storageError);
      }
    }
  }

  const { error } = await supabase.from("posts").delete().eq("id", id);
  return { error: error ? error.message : null };
}

export async function getPosts(
  postIds: string[],
  match?: string
): Promise<{ data: Post[]; error: string | null }> {
  if (postIds.length === 0) return { data: [], error: null };

  const field = match ?? "id";
  const uniqueIds = Array.from(new Set(postIds.filter(Boolean)));
  if (uniqueIds.length === 0) return { data: [], error: null };

  const queryClient = getQueryClient();
  const postsByKey = new Map<string, Post>();
  const missingIds: string[] = [];

  for (const id of uniqueIds) {
    const cached = queryClient.getQueryData<Post | null | undefined>([
      "post",
      field,
      id,
    ]);
    if (cached !== null && cached !== undefined) {
      const keyVal = String((cached as Record<string, unknown>)[field] ?? cached.id);
      postsByKey.set(keyVal, cached);
    } else {
      missingIds.push(id);
    }
  }

  let queryError: string | null = null;

  if (missingIds.length > 0) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        users ( username ),
        communities ( name, icon_url, owner_id ),
        post_votes_view ( upvotes, downvotes ),
        post_replies_view ( count )
      `)
      .in(field, missingIds);

    if (error) {
      queryError = error.message;
    } else {
      for (const p of (data ?? []) as Post[]) {
        const keyVal = String((p as Record<string, unknown>)[field] ?? p.id);
        queryClient.setQueryData(["post", field, keyVal], p);
        postsByKey.set(keyVal, p);
      }
    }
  }

  const orderedPosts: Post[] = [];
  for (const id of uniqueIds) {
    const found = postsByKey.get(id);
    if (found) orderedPosts.push(found);
  }

  return { data: orderedPosts, error: queryError };
}

export async function queryPosts(filters: {
  communityId?: string | null;
  userId?: string | null;
  searchQuery?: string | null;
}): Promise<{ data: Post[]; error: string | null }> {
  const supabase = createClient();
  let query = supabase
    .from("posts")
    .select(`
      *,
      users ( username ),
      communities ( name, icon_url, owner_id ),
      post_votes_view ( upvotes, downvotes ),
      post_replies_view ( count )
    `)
    .order("created_at", { ascending: false });

  if (filters.communityId) {
    query = query.eq("community_id", filters.communityId);
  }
  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters.searchQuery?.trim()) {
    const q = filters.searchQuery.trim().replace(/[(),]/g, "");
    if (q) {
      query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
    }
  }

  const { data, error } = await query;
  const posts = (data ?? []) as Post[];

  if (!error) {
    const queryClient = getQueryClient();
    for (const p of posts) {
      queryClient.setQueryData(["post", "id", p.id], p);
    }
  }

  return {
    data: posts,
    error: error ? error.message : null,
  };
}

// QUERY OPTIONS

export const postQueryOptions = (postId: string | null | undefined) =>
  queryOptions({
    queryKey: ["post", "id", postId] as const,
    enabled: Boolean(postId),
    staleTime: STALE_TIMES.postDetail,
    queryFn: async () => {
      const { data, error } = await getPost(postId!);
      if (error) throw new Error(error);
      return data;
    },
  });

export const postsBatchQueryOptions = (
  postIds: readonly string[],
  match?: string
) => {
  const field = match ?? "id";
  const sortedIds = Array.from(new Set(postIds.filter(Boolean))).sort();

  return queryOptions({
    queryKey: ["posts", "batch", field, sortedIds] as const,
    enabled: sortedIds.length > 0,
    staleTime: STALE_TIMES.postDetail,
    queryFn: async () => {
      const { data, error } = await getPosts(sortedIds, field);
      if (error) throw new Error(error);
      return data;
    },
  });
};

export const postsFeedQueryOptions = (filters: {
  communityId?: string | null;
  userId?: string | null;
  searchQuery?: string | null;
}) => {
  const normalized = {
    communityId: filters.communityId ?? null,
    userId: filters.userId ?? null,
    searchQuery: filters.searchQuery?.trim() || null,
  };

  return queryOptions({
    queryKey: ["posts", normalized] as const,
    staleTime: STALE_TIMES.postsFeed,
    queryFn: async () => {
      const { data, error } = await queryPosts(normalized);
      if (error) throw new Error(error);
      return data;
    },
  });
};

export type { Post };
