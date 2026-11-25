import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { CommunityPageClient } from "./CommunityPageClient";
import { STALE_TIMES } from "@/utils/queryTimings";

const fetchCommunityCached = (id: string) =>
  unstable_cache(
    async () => {
      const supabase = createAnonClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );

      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    },
    ["server-community", id],
    {
      revalidate: Math.floor(STALE_TIMES.communityDetails / 1000),
      tags: [`community-${id}`],
    }
  )();

export const getServerCommunity = cache(async (id: string) => {
  return fetchCommunityCached(id);
});

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const community = await getServerCommunity(id);

  if (!community) {
    return { title: "Community Not Found | UpYarc" };
  }

  return {
    title: `${community.name} | UpYarc`,
    description: community.description ?? `Posts and discussions in ${community.name}`,
  };
}

export default async function CommunityPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const initialCommunity = await getServerCommunity(id);

  if (!initialCommunity) {
    notFound();
  }

  return <CommunityPageClient id={id} initialCommunity={initialCommunity} />;
}
