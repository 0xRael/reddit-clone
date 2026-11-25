import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { STALE_TIMES } from "@/utils/queryTimings";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostPageClient } from "./PostPageClient";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://upyarc.vercel.app";

const fetchPostCached = (id: string) =>
  unstable_cache(
    async () => {
      const supabase = createAnonClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );

      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          users ( username ),
          communities ( name, banner_url, icon_url, owner_id ),
          post_votes_view ( upvotes, downvotes ),
          post_replies_view ( count )
        `)
        .eq("id", id)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    },
    ["server-post", id],
    {
      revalidate: Math.floor(STALE_TIMES.postDetail / 1000),
      tags: [`post-${id}`],
    }
  )();

export const getServerPost = cache(async (id: string) => {
  return fetchPostCached(id);
});

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const post = await getServerPost(id);

  if (!post) {
    return { title: "Post Not Found", robots: { index: false } };
  }

  const description =
    typeof post.body === "string"
      ? post.body.replace(/[#*_`>\-\[\]()!]/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
      : undefined;

  const previewImage = post.image_url || post.communities?.banner_url || post.communities?.icon_url || undefined;

  return {
    title: post.title ?? "Post",
    description,
    alternates: {
      canonical: `/post/${id}`,
    },
    openGraph: {
      type: "article",
      title: post.title ?? "Post",
      description,
      url: `/post/${id}`,
      publishedTime: post.created_at,
      images: previewImage ? [{ url: previewImage }] : undefined,
    },
  };
}

export default async function PostPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const initialPost = await getServerPost(id);

  if (!initialPost) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: initialPost.title,
    text: initialPost.body ?? "",
    datePublished: initialPost.created_at,
    author: initialPost.users?.username
      ? {
          "@type": "Person",
          name: initialPost.users.username,
          url: `${BASE_URL}/user/${initialPost.user_id}`,
        }
      : undefined,
    image: initialPost.image_url ? [initialPost.image_url] : undefined,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: initialPost.post_replies_view?.[0]?.count ?? 0,
      },
    ],
    isPartOf: {
      "@type": "WebSite",
      name: "UpYarc",
      url: BASE_URL,
    },
  };

  return <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
    <PostPageClient postId={id} initialPost={initialPost} />
  </>;
}
