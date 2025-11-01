"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/component"
import { formatDistanceToNow } from "date-fns"

type Notification = {
  id: string
  actor_id?: string | null
  type: string
  reply_id: string | null
  post_id: string | null
  created_at: string
  read: boolean
  actor?: {
    username: string
  }[]
  reply?: {
	  id: string,
	  text: string,
	  post_id: string
  }[]
}

export default function NotificationsPage() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])

	const markAllAsRead = async () => {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;
		
		await supabase.from("notifications")
		  .update({ read: true })
		  .eq("user_id", user.id)
		  .eq("read", false)

	}

  useEffect(() => {
    const loadNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("notifications")
        .select(`
			id,
			type,
			reply_id,
			post_id,
			created_at,
			read,
			actor:actor_id ( username ),
			reply:reply_id (
			  id,
			  text,
			  post_id
			)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching notifications:", error)
      } else {
        setNotifications(data ?? [])
		markAllAsRead()
      }
    }

    loadNotifications()
  }, [supabase])

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
			href={`${window.location.origin}/post/${n.post_id}`}
          >
			<div className="bg-slate-400 rounded-full w-8 h-8 mr-3"></div>
			<div>
				<div className="text-gray-300">
				  <span className="font-bold">{n.actor?.[0]?.username ?? "Someone"}</span>{" "}
				  {n.type === "reply" && "replied to your post."}
				  {n.type === "upvote" && "upvoted your post."}
				  {/* add more types as needed */}
				</div>
				<div className="text-gray-400">
					{n.reply?.text
				  ? n.reply.text.slice(0, 100) + (n.reply?.[0]?.text.length > 100 ? "…" : "")
				  : ""}
			    </div>
				<div className="text-xs text-gray-400">
				  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
				</div>
			</div>
          </Link>
        ))}
      </ul>
    </div>
  )
}
