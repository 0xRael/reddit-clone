"use client";

import Link from "next/link";
import CommunityInfo from "@/components/CommunityInfo";
import { FaRegThumbsUp, FaRegThumbsDown, FaShare } from "react-icons/fa6";
import { FiMessageCircle, FiTrash, FiCopy } from "react-icons/fi";
import { SlOptions } from "react-icons/sl";
import { LuPencil } from "react-icons/lu";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRecentPosts } from "@/hooks/useRecentPosts";

import { Post, Reply } from "@/types";
import { PostMedia } from "@/components/PostMedia";
import { ReplyItem } from "@/components/ReplyItem";
import { MarkdownContent } from "@/components/MarkdownContent";
import { MarkdownEditor } from "@/components/MarkdownEditor";

import { getAuthUserId } from "@/utils/queries/users";
import { getPost, deletePost as deletePostQuery } from "@/utils/queries/posts";
import {
  getPostReplies,
  insertReply,
  updateReply,
  deleteReply,
} from "@/utils/queries/replies";
import {
  performPostVote,
  performReplyVote,
  getUserPostVote,
  getUserReplyVotes,
} from "@/utils/queries/votes";

export default function PostPage(props: { params: Promise<{ id: string }> }) {
  const [postId, setPostId] = useState<string | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [comment, setComment] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const { addPostId } = useRecentPosts();
  const isLoadingRef = useRef(false);

  const [userPostVote, setUserPostVote] = useState<number | null>(null);
  const [userReplyVotes, setUserReplyVotes] = useState<Record<string, number>>(
    {}
  );

  // Unwrap params once per route change
  useEffect(() => {
    let active = true;
    props.params.then(({ id }) => {
      if (active) setPostId(id);
    });
    return () => {
      active = false;
    };
  }, [props.params]);

  async function loadPost() {
    if (!postId || isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      const userId = await getAuthUserId();
      const { data: fetchedPost } = await getPost(postId);
      const { data: replyList } = await getPostReplies(postId);
      console.log(fetchedPost);
      setPost(fetchedPost);
      setReplies(replyList);
      setCurrentUserId(userId);
      setIsModerator(
        Boolean(userId && userId === fetchedPost?.communities?.owner_id)
      );

      if (!userId) {
        setUserPostVote(null);
        setUserReplyVotes({});
        return;
      }

      const replyIds = replyList.map((r) => r.id);
      const postVote = await getUserPostVote(postId, userId);
      const replyVoteMap = await getUserReplyVotes(replyIds, userId);

      setUserPostVote(postVote);
      setUserReplyVotes(replyVoteMap);
    } finally {
      isLoadingRef.current = false;
    }
  };


  useEffect(() => {
    console.log(`postId: ${postId}`)
    if (postId) {
      addPostId(postId);
      loadPost()
    }
  }, [postId]);


  const votePost = async (voteType: number) => {
    if (!currentUserId || !post) return;

    setUserPostVote(voteType);
    const { error } = await performPostVote(post.id, voteType);
    if (error) {
      console.error("Error voting:", error);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    const { error } = await deletePostQuery(post.id, post.image_url);

    if (error) {
      console.error("Failed to delete post row:", error);
      alert("Could not delete post.");
    } else {
      alert("Post deleted");
    }
  };

  const voteReply = async (replyId: string, voteType: number) => {
    if (!currentUserId || !replyId) return;

    setUserReplyVotes((prev) => ({
      ...prev,
      [replyId]: voteType,
    }));

    const { error } = await performReplyVote(replyId, voteType);
    if (error) {
      console.error("Error voting:", error);
    }
  };

  function buildReplyTree(flatReplies: Reply[]): Reply[] {
    const map = new Map<string, Reply>();
    const roots: Reply[] = [];

    for (const r of flatReplies) {
      map.set(r.id, { ...r, children: [] });
    }

    for (const r of flatReplies) {
      const node = map.get(r.id)!;
      if (r.reply_id && map.has(r.reply_id)) {
        map.get(r.reply_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async function postComment(
    textToPost = comment,
    parentReplyId: string | null = null
  ) {
    if (!currentUserId || !post || !textToPost) return;

    const { error } = await insertReply(post.id, textToPost, parentReplyId);

    if (error) {
      console.error("An error occurred when commenting:", error);
    } else {
      if (!parentReplyId) {
        setComment("");
      }
      loadPost();
    }
  }

  async function handleEditReply(replyId: string, newText: string) {
    const { error } = await updateReply(replyId, newText);
    if (error) {
      console.error("Failed to update reply:", error);
      alert("Could not save reply changes.");
    }
  }

  async function handleDeleteReply(replyId: string) {
    const { error } = await deleteReply(replyId);
    if (error) {
      console.error("Failed to delete reply:", error);
      alert("Could not delete reply changes.");
    } else {
      alert("Reply deleted succesfully.");
    }
  }

  function copyLink(idToCopy: string) {
    const url = `${window.location.origin}/post/${idToCopy}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert("Link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  }

  function copyText(text: string) {
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Your copy is ready for pasta!");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  }

  return (
    <div className="w-full h-full justify-center flex relative">
      {post ? (
        <>
          <div className="w-full max-w-3xl">
            <div className="space-y-2 py-3">
              <div className="flex text-sm items-center space-x-2">
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
                <a
                  href={`/user/${post?.user_id}`}
                  className="mr-2 hover:underline"
                >
                  {post?.users.username}
                </a>
                <div className="text-gray-400">•</div>
                <div className="text-gray-400">
                  {formatDistanceToNow(new Date(post?.created_at), {
                    addSuffix: true,
                  })}
                </div>
                {/* Options button */}
                <div className="ml-auto relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 rounded-full hover:bg-white/10"
                  >
                    <SlOptions />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-32 bg-background border border-gray-700 rounded shadow-lg z-10">
                      <button
                        onClick={() => copyText(post.body ?? "")}
                        className="block cursor-pointer flex w-full text-left p-4 text-sm hover:bg-white/5"
                      >
                        <FiCopy size={20} className="mr-2" />
                        Copy Text
                      </button>
                      {currentUserId == post.user_id && (
                        <Link
                          href={`/submit?edit=${post.id}`}
                          className="block flex w-full text-left p-4 text-sm hover:bg-white/5"
                        >
                          <LuPencil size={20} className="mr-2" />
                          Edit Post
                        </Link>
                      )}

                      {isModerator && (
                        <button
                          onClick={handleDeletePost}
                          className="block cursor-pointer flex w-full text-left p-4 text-sm text-red-400 hover:bg-white/5"
                        >
                          <FiTrash size={20} className="mr-2" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <h1 className="w-full block text-xl text-gray-100 font-bold">
                {post?.title}
              </h1>

              {post.image_url && (
                <PostMedia
                  href={post.image_url}
                  src={post.image_url}
                  alt={post.title ?? ""}
                />
              )}

              <MarkdownContent content={post?.body} className="w-full text-base" />

              <div className="flex space-x-2">
                <div className="flex p-2 rounded-full bg-white/10">
                  <button onClick={() => votePost(1)}>
                    <FaRegThumbsUp
                      className={`rounded-full hover:bg-white/10 hover:text-orange-400 ${
                        userPostVote === 1 && "text-orange-400"
                      }`}
                    />
                  </button>

                  <p className="mx-2 text-sm">
                    {post?.post_votes_view?.length
                      ? post.post_votes_view[0].upvotes -
                        post.post_votes_view[0].downvotes
                      : 0}
                  </p>

                  <button onClick={() => votePost(-1)}>
                    <FaRegThumbsDown
                      className={`rounded-full hover:bg-white/10 hover:text-blue-400 ${
                        userPostVote === -1 && "text-blue-400"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex p-2 rounded-full bg-white/10 hover:bg-white/20">
                  <FiMessageCircle />
                  <p className="mx-2 text-sm">
                    {post.post_replies_view?.length
                      ? post.post_replies_view[0].count
                      : 0}
                  </p>
                </div>

                <button
                  onClick={() => copyLink(post.id)}
                  className="flex p-2 rounded-full bg-white/10 hover:bg-white/20"
                >
                  <FaShare />
                  <p className="mx-2 text-sm">Share</p>
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                postComment();
              }}
              className="pt-2 space-y-2"
            >
              <MarkdownEditor
                value={comment}
                onChange={(value) => setComment(value)}
                placeholder={`Join the Conversation...`}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="rounded-full bg-white/15 px-3.5 py-1 text-xs font-medium hover:bg-white/25 disabled:opacity-40"
                >
                  Comment
                </button>
              </div>
            </form>

            {buildReplyTree(replies).map((rootReply) => (
              <ReplyItem
                key={rootReply.id}
                reply={rootReply}
                currentUserId={currentUserId}
                userReplyVotes={userReplyVotes}
                onVoteReply={voteReply}
                onSubmitReply={(text, parentReplyId) =>
                  postComment(text, parentReplyId)
                }
                onEditReply={handleEditReply}
                onDeleteReply={handleDeleteReply}
              />
            ))}
          </div>
          {post.community_id ? (
            <CommunityInfo communityId={post.community_id} />
          ) : (
            <></>
          )}
        </>
      ) : (
        <>Loading Post...</>
      )}
    </div>
  );
}
