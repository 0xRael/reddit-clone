import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { STALE_TIMES } from "@/utils/queryTimings";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserPageClient } from "./UserPageClient";


const fetchUserCached = (id: string) =>
  unstable_cache(
    async () => {
      const supabase = createAnonClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    },
    ["server-user", id],
    {
      revalidate: Math.floor(STALE_TIMES.userProfile / 1000),
      tags: [`user-${id}`],
    }
  )();

export const getServerUser = cache(async (id: string) => {
  return fetchUserCached(id);
});

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const user = await getServerUser(id);

  if (!user) {
    return { title: "User Not Found", robots: { index: false } };
  }

  const description = `Posts by ${user.username} on UpYarc`;

  return {
    title: user.username,
    description,
    alternates: {
      canonical: `/user/${id}`,
    },
    openGraph: {
      type: "profile",
      title: user.username,
      description,
      url: `/user/${id}`,
      username: user.username,
    },
  };
}

export default async function UserPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const initialUser = await getServerUser(id);

  if (!initialUser) {
    notFound();
  }

  return <UserPageClient id={id} initialUser={initialUser} />;
}
