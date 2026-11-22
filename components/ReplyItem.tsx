"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { FaRegThumbsUp, FaRegThumbsDown, FaShare } from "react-icons/fa6";
import { FiMessageCircle } from "react-icons/fi";
import { SlOptions } from "react-icons/sl";
import { Reply } from "@/types";
import { MarkdownContent } from "@/components/MarkdownContent"

interface ReplyItemProps {
  reply: Reply;
  userReplyVotes: Record<string, number>;
  onVoteReply: (replyId: string, voteType: number) => void;
  onSubmitReply: (text: string, parentReplyId: string) => Promise<void>;
  depth?: number;
}

export function ReplyItem({
  reply,
  userReplyVotes,
  onVoteReply,
  onSubmitReply,
  depth = 0,
}: ReplyItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const children = reply.children ?? [];
  const hasChildren = children.length > 0;

  const activeReplyVote = userReplyVotes[reply.id] ?? null;
  const replyScore = reply.reply_votes_view?.length
    ? reply.reply_votes_view[0].upvotes - reply.reply_votes_view[0].downvotes
    : 0;

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitReply(trimmed, reply.id);
      setReplyText("");
      setIsReplying(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={depth === 0 ? "mb-6" : ""}>
      {/* Comment Row: Avatar Rail + Content */}
      <div className="relative flex gap-2">
        {/* Avatar (32px x 32px -> center at 16px) */}
        <div className="relative z-10 w-8 h-8 rounded-full bg-slate-400 shrink-0" />

        {/* Vertical trunk line under avatar (only if this reply has children) */}
        {hasChildren && (
          <div
            aria-hidden="true"
            className="absolute left-[16px] top-8 bottom-0 w-px bg-gray-700"
          />
        )}

        {/* Right column: Header, Body, Actions, Inline Reply Box */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header */}
          <div className="flex items-center text-sm space-x-2 h-8">
            <a
              href={`/user/${reply.user_id}`}
              className="font-medium hover:underline"
            >
              {reply.users.username}
            </a>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400 text-xs">
              {formatDistanceToNow(new Date(reply.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Body */}
          <MarkdownContent content={reply.text} className="w-full text-base" />

          {/* Actions */}
          <div className="flex items-center space-x-1 text-gray-300 text-sm pt-0.5">
            <div className="flex items-center p-1 rounded-full">
              <button
                type="button"
                onClick={() => onVoteReply(reply.id, 1)}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <FaRegThumbsUp
                  className={`hover:text-orange-400 ${
                    activeReplyVote === 1 ? "text-orange-400" : ""
                  }`}
                />
              </button>

              <span className="mx-1.5 text-xs">{replyScore}</span>

              <button
                type="button"
                onClick={() => onVoteReply(reply.id, -1)}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <FaRegThumbsDown
                  className={`hover:text-blue-400 ${
                    activeReplyVote === -1 ? "text-blue-400" : ""
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsReplying((prev) => !prev)}
              className="flex items-center px-2.5 py-1.5 rounded-full hover:bg-white/10"
            >
              <FiMessageCircle />
              <span className="ml-1.5 text-xs">Reply</span>
            </button>

            {/*<button
              type="button"
              className="flex items-center px-2.5 py-1.5 rounded-full hover:bg-white/10"
            >
              <FaShare />
              <span className="ml-1.5 text-xs">Share</span>
            </button>

            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-white/10"
            >
              <SlOptions />
            </button>*/}
          </div>

          {/* Inline Reply Box */}
          {isReplying && (
            <form onSubmit={handleReplySubmit} className="pt-2 space-y-2">
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${reply.users.username}...`}
                className="w-full rounded-xl border border-gray-600 bg-transparent p-2.5 text-sm focus:border-gray-400 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyText("");
                  }}
                  className="rounded-full px-3 py-1 text-xs text-gray-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !replyText.trim()}
                  className="rounded-full bg-white/15 px-3.5 py-1 text-xs font-medium hover:bg-white/25 disabled:opacity-40"
                >
                  {isSubmitting ? "Posting..." : "Reply"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Nested Children with Curved Thread Connectors */}
      {hasChildren && (
        <div className="pl-10">
          {children.map((child, idx) => {
            const isLast = idx === children.length - 1;

            return (
              <div key={child.id} className="relative pt-3">
                {/* Continue parent's vertical line down to the next sibling */}
                {!isLast && (
                  <div
                    aria-hidden="true"
                    className="absolute -left-[24px] top-0 bottom-0 w-px bg-gray-700"
                  />
                )}

                {/* Curved L-branch into the middle of this child's avatar */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-[24px] top-0 h-[28px] w-[20px] rounded-bl-xl border-b border-l border-gray-700"
                />

                <ReplyItem
                  reply={child}
                  userReplyVotes={userReplyVotes}
                  onVoteReply={onVoteReply}
                  onSubmitReply={onSubmitReply}
                  depth={depth + 1}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
