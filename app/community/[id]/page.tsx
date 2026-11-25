import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { CommunityPageClient } from "./CommunityPageClient";
import { STALE_TIMES } from "@/utils/queryTimings";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://upyarc.vercel.app";

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
    return { title: "Community Not Found", robots: { index: false } };
  }

  const description =
    community.description ?? `Posts and discussions in ${community.name}`;
  const previewImage = community.banner_url || community.icon_url || undefined;

  return {
    title: community.name,
    description,
    alternates: {
      canonical: `/community/${id}`,
    },
    openGraph: {
      type: "website",
      title: community.name,
      description,
      url: `/community/${id}`,
      images: previewImage ? [{ url: previewImage }] : undefined,
    },
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

  const previewImage =
    initialCommunity.banner_url || initialCommunity.icon_url || undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: initialCommunity.name,
    description:
      initialCommunity.description ??
      `Posts and discussions in ${initialCommunity.name}`,
    url: `${BASE_URL}/community/${id}`,
    dateCreated: initialCommunity.created_at ?? undefined,
    image: previewImage ? [previewImage] : undefined,
    isPartOf: {
      "@type": "WebSite",
      name: "UpYarc",
      url: BASE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <CommunityPageClient id={id} initialCommunity={initialCommunity} />
    </>
  );
}
