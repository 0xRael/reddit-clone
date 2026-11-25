import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { STALE_TIMES } from "@/utils/queryTimings";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostPageClient } from "./PostPageClient";


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
          communities ( name, icon_url, owner_id ),
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
    return { title: "Post Not Found | UpYarc" };
  }

  const plainExcerpt =
    typeof post.body === "string"
      ? post.body.replace(/[#*_`>\-\[\]()!]/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
      : undefined;

  return {
    title: `${post.title ?? "Post"} | UpYarc`,
    description: plainExcerpt || undefined,
    openGraph: post.image_url
      ? {
          title: post.title ?? "Post",
          description: plainExcerpt,
          images: [{ url: post.image_url }],
        }
      : undefined,
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

  return <PostPageClient postId={id} initialPost={initialPost} />;
}
