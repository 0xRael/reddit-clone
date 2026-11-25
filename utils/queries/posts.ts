import { createClient } from "@/utils/supabase/component";
import type { Post } from "@/types";
import { resolveMentionsToTokens } from "@/utils/mentions";
import { getAuthUserId } from "@/utils/queries/users";
import {
  getCached,
  invalidateCacheByPrefix,
  readCache,
  writeCache,
} from "@/utils/cache";

const POST_TTL_MS = 120 * 1000; // 2 minutes (short so vote/reply counts stay fairly fresh)
const FEED_TTL_MS = 5 * 60 * 1000; // 5 minutes for feed/search lists

export async function updatePost(
  id: string,
  title: string,
  body?: string | null,
  communityId?: string | null,
  imageUrl?: string | null
): Promise<{ data: Post | null; error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { data: null, error: "User not Authenticated." };
  }

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

  if (!error) {
    invalidateCacheByPrefix(`post:id:${id}`);
    invalidateCacheByPrefix("posts-query:");
  }

  return {
    data,
    error: error ? error.message : null,
  };
}

export async function insertPost(
  title: string,
  body?: string | null,
  communityId?: string | null,
  imageUrl?: string | null
): Promise<{ data: Post | null; error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { data: null, error: "User not Authenticated." };
  }

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

  if (!error) {
    invalidateCacheByPrefix("posts-query:");
  }

  return {
    data,
    error: error ? error.message : null,
  };
}

export async function getPost(
  id: string
): Promise<{ data: Post | null; error: string | null }> {
  return getCached(`post:id:${id}`, POST_TTL_MS, async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        users (
          username
        ),
        communities (
          name,
          icon_url,
          owner_id
        ),
        post_votes_view (
          upvotes,
          downvotes
        ),
        post_replies_view (
          count
        )
      `)
      .eq("id", id)
      .single<Post>();

    return {
      data,
      error: error ? error.message : null,
    };
  });
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

  if (!error) {
    invalidateCacheByPrefix(`post:id:${id}`);
    invalidateCacheByPrefix("posts-query:");
  }

  return {
    error: error ? error.message : null,
  };
}

export async function getPosts(
  postIds: string[],
  match?: string
): Promise<{ data: Post[]; error: string | null }> {
  if (postIds.length === 0) {
    return { data: [], error: null };
  }

  const field = match ?? "id";
  const uniqueIds = Array.from(new Set(postIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return { data: [], error: null };
  }

  const postsByKey = new Map<string, Post>();
  const missingIds: string[] = [];

  for (const id of uniqueIds) {
    const cacheKey = `post:${field}:${id}`;
    const cachedPost = readCache<Post | null>(cacheKey);
    if (cachedPost !== undefined && cachedPost !== null) {
      postsByKey.set(String((cachedPost as Record<string, unknown>)[field] ?? cachedPost.id), cachedPost);
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
        users (
          username
        ),
        communities (
          name,
          icon_url,
          owner_id
        ),
        post_votes_view (
          upvotes,
          downvotes
        ),
        post_replies_view (
          count
        )
      `)
      .in(field, missingIds);

    if (error) {
      queryError = error.message;
    } else {
      const fetchedPosts = (data ?? []) as Post[];
      for (const p of fetchedPosts) {
        const keyVal = String((p as Record<string, unknown>)[field] ?? p.id);
        writeCache(`post:${field}:${keyVal}`, {data:p, error:null}, POST_TTL_MS);
        postsByKey.set(keyVal, p);
      }
    }
  }

  const orderedPosts: Post[] = [];
  for (const id of uniqueIds) {
    const found = postsByKey.get(id);
    if (found) {
      orderedPosts.push(found);
    }
  }

  return {
    data: orderedPosts,
    error: queryError,
  };
}

function buildQueryPostsCacheKey(filters: {
  communityId?: string | null;
  userId?: string | null;
  searchQuery?: string | null;
}): string {
  const c = filters.communityId ?? "";
  const u = filters.userId ?? "";
  const q = (filters.searchQuery ?? "").trim().toLowerCase();
  return `posts-query:c=${c}|u=${u}|q=${encodeURIComponent(q)}`;
}

export async function queryPosts(filters: {
  communityId?: string | null;
  userId?: string | null;
  searchQuery?: string | null;
}): Promise<{ data: Post[]; error: string | null }> {
  const cacheKey = buildQueryPostsCacheKey(filters);

  const result = await getCached(cacheKey, FEED_TTL_MS, async () => {
    const supabase = createClient();
    let query = supabase
      .from("posts")
      .select(`
        *,
        users (
          username
        ),
        communities (
          name,
          icon_url,
          owner_id
        ),
        post_votes_view (
          upvotes,
          downvotes
        ),
        post_replies_view (
          count
        )
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

    return {
      data: (data ?? []) as Post[],
      error: error ? error.message : null,
    };
  });

  if (result.error) {
    invalidateCacheByPrefix(cacheKey);
    return result;
  }

  // Warm individual post cache entries so getPost / getPosts can reuse them
  for (const p of result.data) {
    writeCache(`post:id:${p.id}`, {data:p, error:null}, POST_TTL_MS);
  }

  return result;
}

export type { Post };
