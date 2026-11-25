import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/component";
import type { Community, CommunityAndOwner } from "@/types";
import { getAuthUserId } from "./users";
import { resolveMentionsToTokens } from "@/utils/mentions";
import { STALE_TIMES } from "@/utils/queryTimings";

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

  return {
    data,
    error: error ? error.message : null,
  };
}

export async function getCommunity(
  id: string
): Promise<{ data: Community | null; error: string | null }> {
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
}

export async function getCommunityAndOwner(
  id: string
): Promise<{ data: CommunityAndOwner | null; error: string | null }> {
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
}

export async function getOwnedCommunities(
  userId?: string | null
): Promise<{ data: Community[]; error: string | null }> {
  const queryId = userId ?? (await getAuthUserId());
  if (!queryId) {
    return { data: [], error: "User is not Authenticated." };
  }

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

export async function getJoinedCommunities(
  userId?: string | null
): Promise<{ data: Community[]; error: string | null }> {
  const queryId = userId ?? (await getAuthUserId());
  if (!queryId) {
    return { data: [], error: "User is not Authenticated." };
  }

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

export async function isCommunityOwner(community: Community): Promise<boolean> {
  const userId = await getAuthUserId();
  return userId === community.owner_id;
}

export async function hasJoinedCommunity(communityId: string): Promise<boolean> {
  const userId = await getAuthUserId();
  if (!userId) {
    return false;
  }

      const supabase = createClient();
      const { data: joinExists } = await supabase
        .from("joins")
        .select("community_id")
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .maybeSingle();

      return joinExists !== null;
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

  return {
    error: error ? error.message : null,
  };
}

export async function getAllCommunities(): Promise<{
  data: Community[];
  error: string | null;
}> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .order("created_at", { ascending: false });

    return {
      data: data ?? [],
      error: error ? error.message : null,
    };
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

// QUERY OPTIONS

export const communityQueryOptions = (id: string | null | undefined) =>
  queryOptions({
    queryKey: ["community", id] as const,
    enabled: Boolean(id),
    staleTime: STALE_TIMES.communityDetails,
    queryFn: async () => {
      const { data, error } = await getCommunity(id!);
      if (error) throw new Error(error);
      return data;
    },
  });

export const communityAndOwnerQueryOptions = (id: string | null | undefined) =>
  queryOptions({
    queryKey: ["community-owner", id] as const,
    enabled: Boolean(id),
    staleTime: STALE_TIMES.communityDetails,
    queryFn: async () => {
      const { data, error } = await getCommunityAndOwner(id!);
      if (error) throw new Error(error);
      return data;
    },
  });

export const ownedCommunitiesQueryOptions = (userId?: string | null) =>
  queryOptions({
    queryKey: ["communities", "owned", userId ?? "current"] as const,
    staleTime: STALE_TIMES.communityDetails,
    queryFn: async () => {
      const { data, error } = await getOwnedCommunities(userId);
      if (error) throw new Error(error);
      return data;
    },
  });

export const joinedCommunitiesQueryOptions = (userId?: string | null) =>
  queryOptions({
    queryKey: ["communities", "joined", userId ?? "current"] as const,
    staleTime: STALE_TIMES.communityMembership,
    queryFn: async () => {
      const { data, error } = await getJoinedCommunities(userId);
      if (error) throw new Error(error);
      return data;
    },
  });

export const communityOwnerCheckQueryOptions = (
  community: Community | null | undefined
) =>
  queryOptions({
    queryKey: ["community-owner-check", community?.id, community?.owner_id] as const,
    enabled: Boolean(community),
    staleTime: STALE_TIMES.communityDetails,
    queryFn: () => isCommunityOwner(community!),
  });

export const hasJoinedCommunityQueryOptions = (
  communityId: string | null | undefined
) =>
  queryOptions({
    queryKey: ["community-joined", communityId] as const,
    enabled: Boolean(communityId),
    staleTime: STALE_TIMES.communityMembership,
    queryFn: () => hasJoinedCommunity(communityId!),
  });

export const allCommunitiesQueryOptions = () =>
  queryOptions({
    queryKey: ["communities", "all"] as const,
    staleTime: STALE_TIMES.communityDirectory,
    queryFn: async () => {
      const { data, error } = await getAllCommunities();
      if (error) throw new Error(error);
      return data;
    },
  });

export const searchCommunitiesQueryOptions = (query: string) => {
  const trimmed = query.trim();
  return queryOptions({
    queryKey: ["communities", "search", trimmed.toLowerCase()] as const,
    enabled: Boolean(trimmed),
    staleTime: STALE_TIMES.communityDirectory,
    queryFn: async () => {
      const { data, error } = await searchCommunities(trimmed);
      if (error) throw new Error(error);
      return data;
    },
  });
};

export type { Community, CommunityAndOwner }
