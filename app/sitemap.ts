import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://upyarc.vercel.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const now = new Date();

  const [{ data: communities }, { data: posts }, { data: users }] =
    await Promise.all([
      supabase.from("communities").select("id, created_at").limit(500),
      supabase
        .from("posts")
        .select("id, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase.from("users").select("id").limit(1000),
    ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/explore`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/notifications`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/settings`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];

  const communityRoutes: MetadataRoute.Sitemap = (communities ?? []).map((c) => ({
    url: `${BASE_URL}/community/${c.id}`,
    lastModified: c.created_at ? new Date(c.created_at) : now,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `${BASE_URL}/post/${p.id}`,
    lastModified: p.created_at ? new Date(p.created_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const userRoutes: MetadataRoute.Sitemap = (users ?? []).map((u) => ({
    url: `${BASE_URL}/user/${u.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...communityRoutes,
    ...postRoutes,
    ...userRoutes,
  ];
}
