import { createClient } from "@/utils/supabase/component";
import type { Community, CommunityAndOwner } from "@/types";
import { getAuthUserId } from "./users";
import { resolveMentionsToTokens } from "@/utils/mentions";
import { getCached, invalidateCacheByPrefix } from "@/utils/cache";

const COMMUNITY_TTL_MS = 20 * 60 * 1000; // 20 minutes
const MEMBERSHIP_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function updateCommunity(
  id: string,
  name: string,
  description?: string | null
): Promise<{ data: Community | null; error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { data: null, error: "User not Authenticated." };
  }

  const supabase = createClient();
  const formattedText = description
    ? await resolveMentionsToTokens(description)
    : null;

  const { data, error } = await supabase
    .from("communities")
    .update({
      name: name.trim(),
      description: formattedText,
    })
    .eq("id", id)
    .eq("owner_id", userId)
    .select("*")
    .single<Community>();

  if (!error) {
    invalidateCacheByPrefix(`community:${id}`);
    invalidateCacheByPrefix("community-owner:");
    invalidateCacheByPrefix("owned-communities:");
    invalidateCacheByPrefix("joined-communities:");
  }

  return {
    data,
    error: error ? error.message : null,
  };
}

export async function insertCommunity(
  name: string,
  description?: string | null
): Promise<{ data: Community | null; error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { data: null, error: "User not Authenticated." };
  }

  const supabase = createClient();
  const formattedText = description
    ? await resolveMentionsToTokens(description)
    : null;

  const { data, error } = await supabase
    .from("communities")
    .insert({
      name: name.trim(),
      description: formattedText,
      owner_id: userId,
    })
    .select("*")
    .single<Community>();

  if (!error) {
    invalidateCacheByPrefix(`owned-communities:${userId}`);
    invalidateCacheByPrefix(`joined-communities:${userId}`);
  }

  return {
    data,
    error: error ? error.message : null,
  };
}

export async function getCommunity(
  id: string
): Promise<{ data: Community | null; error: string | null }> {
  return getCached(`community:${id}`, COMMUNITY_TTL_MS, async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .eq("id", id)
      .single<Community>();

    return {
      data,
      error: error ? error.message : null,
    };
  });
}

export async function getCommunityAndOwner(
  id: string
): Promise<{ data: CommunityAndOwner | null; error: string | null }> {
  return getCached(`community-owner:${id}`, COMMUNITY_TTL_MS, async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("communities")
      .select(`
        *,
        owner:owner_id (*)
      `)
      .eq("id", id)
      .single<CommunityAndOwner>();

    return {
      data,
      error: error ? error.message : null,
    };
  });
}

export async function getOwnedCommunities(
  userId?: string | null
): Promise<{ data: Community[]; error: string | null }> {
  const queryId = userId ?? (await getAuthUserId());
  if (!queryId) {
    return { data: [], error: "User is not Authenticated." };
  }

  return getCached(
    `owned-communities:${queryId}`,
    COMMUNITY_TTL_MS,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("owner_id", queryId);

      return {
        data: data ?? [],
        error: error ? error.message : null,
      };
    }
  );
}

export async function getJoinedCommunities(
  userId?: string | null
): Promise<{ data: Community[]; error: string | null }> {
  const queryId = userId ?? (await getAuthUserId());
  if (!queryId) {
    return { data: [], error: "User is not Authenticated." };
  }

  return getCached(
    `joined-communities:${queryId}`,
    MEMBERSHIP_TTL_MS,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("joins")
        .select(`
          communities (
            *
          )
        `)
        .eq("user_id", queryId);

      const communities = (data ?? []).flatMap((row) => {
        if (!row.communities) return [];
        return Array.isArray(row.communities)
          ? row.communities
          : [row.communities];
      });

      return {
        data: communities,
        error: error ? error.message : null,
      };
    }
  );
}

export async function isCommunityOwner(community: Community): Promise<boolean> {
  const userId = await getAuthUserId();
  return userId === community.owner_id;
}

export async function hasJoinedCommunity(communityId: string): Promise<boolean> {
  const userId = await getAuthUserId();
  if (!userId) {
    return false;
  }

  return getCached(
    `has-joined:${userId}:${communityId}`,
    MEMBERSHIP_TTL_MS,
    async () => {
      const supabase = createClient();
      const { data: joinExists } = await supabase
        .from("joins")
        .select("community_id")
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .maybeSingle();

      return joinExists !== null;
    }
  );
}

export async function leaveCommunity(
  communityId: string
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { error: "User is not Authenticated." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("joins")
    .delete()
    .eq("user_id", userId)
    .eq("community_id", communityId);

  if (!error) {
    invalidateCacheByPrefix(`joined-communities:${userId}`);
    invalidateCacheByPrefix(`has-joined:${userId}:${communityId}`);
  }

  return {
    error: error ? error.message : null,
  };
}

export async function joinCommunity(
  communityId: string
): Promise<{ error: string | null }> {
  const userId = await getAuthUserId();
  if (!userId) {
    return { error: "User is not Authenticated." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("joins").insert({
    user_id: userId,
    community_id: communityId,
  });

  if (!error) {
    invalidateCacheByPrefix(`joined-communities:${userId}`);
    invalidateCacheByPrefix(`has-joined:${userId}:${communityId}`);
  }

  return {
    error: error ? error.message : null,
  };
}

export async function getAllCommunities(): Promise<{
  data: Community[];
  error: string | null;
}> {
  return getCached("communities:all", COMMUNITY_TTL_MS, async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .order("created_at", { ascending: false });

    return {
      data: data ?? [],
      error: error ? error.message : null,
    };
  });
}

export async function searchCommunities(
  query: string
): Promise<{ data: Community[]; error: string | null }> {
  const trimmed = query.trim();
  if (!trimmed) return { data: [], error: null };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: false })
    .or(`name.ilike.%${trimmed}%,description.ilike.%${trimmed}%`);

  return {
    data: data ?? [],
    error: error ? error.message : null,
  };
}

export type { Community, CommunityAndOwner }
