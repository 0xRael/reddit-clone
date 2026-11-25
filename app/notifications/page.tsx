"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { MarkdownExcerpt } from "@/components/MarkdownExcerpt";
import {
  notificationsQueryOptions,
  unreadNotificationsCountQueryOptions,
  markAllNotificationsAsRead,
} from "@/utils/queries/notifications";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery(notificationsQueryOptions());

  const markReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await markAllNotificationsAsRead();
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: unreadNotificationsCountQueryOptions().queryKey,
      });
    },
  });

  useEffect(() => {
    if (
      notifications.some((n) => !n.read) &&
      !markReadMutation.isPending &&
      !markReadMutation.isSuccess
    ) {
      markReadMutation.mutate();
    }
  }, [notifications, markReadMutation]);

  return (
    <div className="max-w-4xl mx-auto p-6 w-full">
      <h1 className="text-2xl w-full font-bold mb-4 text-white">Notifications</h1>
      <ul className="space-y-3 w-full">
        {notifications.length === 0 && (
          <p className="text-gray-400">No notifications yet.</p>
        )}
        {notifications.map((n) => (
          <Link
            key={n.id}
            className={`p-4 w-full flex ${
              n.read ? "hover:bg-white/10" : "bg-white/20 hover:bg-white/30"
            }`}
            href={`/post/${n.post_id}`}
          >
            <div className="bg-slate-400 rounded-full w-8 h-8 mr-3"></div>
            <div>
              <div className="text-gray-300">
                <span className="font-bold">
                  {n.actor?.username ?? "Someone"}
                </span>{" "}
                {n.type === "reply" && "replied to your post."}
                {n.type === "mention" && "mentioned you in a post/reply."}
                {n.type === "upvote" && "upvoted your post."}
              </div>
              {n.reply && (
                <div className="line-clamp-2 text-sm text-gray-300">
                  <MarkdownExcerpt
                    content={n.reply.text}
                    hideMediaAndCodeBlocks={false}
                  />
                </div>
              )}
              <div className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </div>
            </div>
          </Link>
        ))}
      </ul>
    </div>
  );
}
