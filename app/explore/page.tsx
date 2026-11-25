// app/explore/page.tsx
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { STALE_TIMES } from "@/utils/queryTimings";
import ExploreClient from "./ExploreClient";

export const metadata: Metadata = {
  title: "Explore Communities",
  description: "Discover and join active communities on UpYarc.",
  alternates: {
    canonical: "/explore",
  },
};

const getServerAllCommunities = unstable_cache(
  async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data;
  },
  ["server-all-communities"],
  {
    revalidate: Math.floor(STALE_TIMES.communityDirectory / 1000),
    tags: ["communities"],
  }
);

export default async function ExplorePage() {
  const initialCommunities = await getServerAllCommunities();
  return <ExploreClient initialCommunities={initialCommunities} />;
}
