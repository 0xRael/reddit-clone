"use client";

import Link from "next/link";
import { FaRegThumbsUp, FaRegThumbsDown, FaShare } from "react-icons/fa6";
import { FiMessageCircle } from "react-icons/fi";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

import { Post } from "@/types";
import { PostMedia } from "@/components/PostMedia";
import { MarkdownExcerpt } from "@/components/MarkdownExcerpt";
import { performPostVote } from "@/utils/queries/votes";
import { queryPosts } from "@/utils/queries/posts";

type Props = {
  communityId?: string | null;
  userId?: string | null;
  searchQuery?: string | null;
};

const PostsList = ({ communityId, userId, searchQuery }: Props) => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    queryPosts({ communityId, userId, searchQuery }).then(({ data, error }) => {
      if (error) {
        console.error("Error fetching posts:", error);
      } else {
        setPosts(data);
      }
    });
  }, [communityId, userId, searchQuery]);

  const votePost = async (postId: string, voteType: number) => {
    const { error } = await performPostVote(postId, voteType);
    if (error) {
      console.error("Error voting:", error);
    }
  };

  function copyLink(postId: string) {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert("Link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  }

  return (
    <main className="flex h-full min-h-screen flex-col w-full max-w-2xl">
      {posts.map((post) => (
        <div className="border-t-1 border-gray-700" key={post.id}>
          <div className="p-3 space-y-2 rounded-xl hover:bg-white/5">
            <div className="flex text-sm space-x-2 items-center">
              <div className="shrink-0">
                <div className="bg-slate-400 rounded-full w-8 h-8 overflow-hidden flex items-center justify-center">
                  {post.communities?.icon_url ? (
                    <img
                      src={post.communities?.icon_url}
                      alt={post.communities?.name ?? "Community icon"}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
              </div>
              <div className="mr-2">
                {(!communityId && post.communities?.name) || post.users.username}
              </div>
              <div className="text-gray-400">•</div>
              <div className="text-gray-400">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                })}
              </div>
            </div>

            <Link
              href={`/post/${post.id}`}
              className="w-full block text-lg text-gray-100 font-bold"
            >
              {post.title}
            </Link>

            {post.image_url ? (
              <PostMedia
                href={`/post/${post.id}`}
                src={post.image_url}
                alt={post.title ?? ""}
              />
            ) : (
              <Link href={`/post/${post.id}`} className="w-full line-clamp-3">
                <MarkdownExcerpt
                  content={post.body}
                  hideMediaAndCodeBlocks={false}
                />
              </Link>
            )}

            <div className="flex space-x-2">
              <div className="flex p-2 rounded-full bg-white/10">
                <button onClick={() => votePost(post.id, 1)}>
                  <FaRegThumbsUp className="rounded-full hover:bg-white/10 hover:text-orange-400" />
                </button>

                <p className="mx-2 text-sm">
                  {post.post_votes_view?.length
                    ? post.post_votes_view[0].upvotes -
                      post.post_votes_view[0].downvotes
                    : 0}
                </p>

                <button onClick={() => votePost(post.id, -1)}>
                  <FaRegThumbsDown className="rounded-full hover:bg-white/10 hover:text-blue-400" />
                </button>
              </div>

              <Link
                href={`/post/${post.id}`}
                className="flex p-2 rounded-full bg-white/10 hover:bg-white/20"
              >
                <FiMessageCircle />
                <p className="mx-2 text-sm">
                  {post.post_replies_view?.length
                    ? post.post_replies_view[0].count
                    : 0}
                </p>
              </Link>

              <button
                onClick={() => copyLink(post.id)}
                className="flex p-2 rounded-full bg-white/10 hover:bg-white/20"
              >
                <FaShare />
                <p className="mx-2 text-sm">Share</p>
              </button>
            </div>
          </div>
        </div>
      ))}
    </main>
  );
};

export default PostsList;
