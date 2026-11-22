"use client"

import { createClient } from '@/utils/supabase/component';
import CommunityInfo from '@/components/CommunityInfo';
import { FaRegThumbsUp, FaRegThumbsDown, FaShare } from "react-icons/fa6";
import { FiMessageCircle, FiTrash, FiCopy } from "react-icons/fi";
import { SlOptions } from "react-icons/sl";
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react'
import { useRecentPosts } from "@/hooks/useRecentPosts";

import { Post, Reply } from '@/types'
import { PostMedia } from "@/components/PostMedia"
import { ReplyItem } from "@/components/ReplyItem";
import { MarkdownContent } from "@/components/MarkdownContent"

import { resolveMentionsToTokens } from "@/utils/mentions";

export default function PostPage(props: { params: Promise<{ id: string }> }) {
	const supabase = createClient()
	const [post, setPost] = useState<Post | null>(null)
	const [replies, setReplies] = useState<Reply[]>([])
	const [comment, setComment] = useState('')
	const [showDropdown, setShowDropdown] = useState(false)
	const { addPostId } = useRecentPosts(); // To register into recent posts

  const [userPostVote, setUserPostVote] = useState<number | null>(null)
	const [userReplyVotes, setUserReplyVotes] = useState<Record<string, number>>({})
	
	const loadPost = async () => {
		const { id } = await props.params
		
		const { data: fetched_post } = await supabase
		.from('posts')
		.select(`
			*,
			users (
				username
			),
			communities (
				name,
				icon_url
			),
			post_votes_view (
				upvotes,
				downvotes
			),
			post_replies_view (
				count
			)
		`)
		.eq('id', id)
		.single<Post>()
		
		setPost(fetched_post);
		addPostId(id);
		
		const { data: fetched_replies } = await supabase
		.from('replies')
		.select(`
			*,
			users (
				username
			),
      reply_votes_view (
        upvotes,
        downvotes 
      )
		`)
		.eq('post_id', id)

const replyList = fetched_replies ?? [];
		setReplies(replyList);

		// Load current user's existing votes so active buttons stay highlighted
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			setUserPostVote(null)
			setUserReplyVotes({})
			return
		}

		const { data: existingPostVote } = await supabase
			.from("vote")
			.select("type")
			.eq("user_id", user.id)
			.eq("post_id", id)
			.maybeSingle()

		setUserPostVote(existingPostVote?.type ?? null)

		if (replyList.length > 0) {
			const replyIds = replyList.map((r) => r.id)
			const { data: existingReplyVotes } = await supabase
				.from("vote")
				.select("reply_id, type")
				.eq("user_id", user.id)
				.in("reply_id", replyIds)

			const replyVoteMap: Record<string, number> = {}
			for (const row of existingReplyVotes ?? []) {
				if (row.reply_id) {
					replyVoteMap[row.reply_id] = row.type
				}
			}
			setUserReplyVotes(replyVoteMap)
		} else {
			setUserReplyVotes({})
		}
    }
	
	useEffect(() => {
		loadPost()
	}, [supabase])
	
	const votePost = async (voteType: number) => {
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user || !post) {
			return
		}

    const { error } = await supabase
    .from("vote")
    .upsert(
      {
        user_id: user.id,
        post_id: post.id,
        type: voteType,
      },
      {
        onConflict: "user_id,post_id",
      }
    );

    setUserPostVote(voteType);
		
		if (error) {
			console.error("Error voting:", error)
		}
	}
	
	const deletePost = async () => {
		const { id } = await props.params
		// 1. If the post has an image, delete it from Storage first
		if (post?.image_url) {
			const filePath = post.image_url.split('/post_images/')[1]
			
			if (filePath) {
				const { error: storageError } = await supabase.storage
					.from('post_images')
					.remove([filePath])

				if (storageError) {
					console.error("Failed to delete image from storage:", storageError)
				}
			}
		}

		const { error } = await supabase
			.from('posts')
			.delete()
			.eq('id', id)

		if (error) {
			console.error("Failed to delete post row:", error)
			alert("Could not delete post.")
		} else {
			alert("Post deleted")
		}
	}
	
	const voteReply = async (replyId: string, voteType: number) => {
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user || !replyId) {
			return
		}
	  
    const { error } = await supabase
    .from("vote")
    .upsert(
      {
        user_id: user.id,
        reply_id: replyId,
        type: voteType,
      },
      {
        onConflict: "user_id,reply_id",
      }
    ); 

    setUserReplyVotes((prev) => ({
			...prev,
			[replyId]: voteType,
		}))
		
		if (error) {
			console.error("Error voting:", error)
		}
	}
	
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

async function postComment(textToPost = comment, parentReplyId: string | null = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !post || !textToPost) {
    return;
  }
  const formattedText = await resolveMentionsToTokens(textToPost);

  const { error } = await supabase
    .from("replies")
    .insert({
      text: formattedText,
      user_id: user.id,
      post_id: post.id,
      reply_id: parentReplyId,
    });

  if (error) {
    console.error("An error occurred when commenting:", error);
  } else {
    if (!parentReplyId) {
      setComment("");
    }
    loadPost();
  }
}

	function copyLink(postId: string) {
	  const url = `${window.location.origin}/post/${postId}`
	  navigator.clipboard.writeText(url)
		.then(() => {
		  alert("Link copied to clipboard!")
		})
		.catch((err) => {
		  console.error("Failed to copy:", err)
		})
	}
	
	function copyText(text: string) {
		if (!text) {
			return;
		}

		navigator.clipboard.writeText(text)
			.then(() => {
			  alert("Your copy is ready for pasta!");
			})
			.catch((err) => {
			  console.error("Failed to copy:", err);
			});
	}

	
  return (
  <div className="w-full h-full justify-center flex relative">
	{ post ? <><div className="w-full max-w-3xl">
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
				<a href={`/user/${post?.user_id}`} className="mr-2 hover:underline">
					{post?.users.username}
				</a>
				<div className="text-gray-400">•</div>
				<div className="text-gray-400">{formatDistanceToNow(new Date(post?.created_at), { addSuffix: true })}</div>
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
						className="block flex w-full text-left p-4 text-sm hover:bg-white/5"
						>
							<FiCopy size={20} className="mr-2" />
							Copy Text
						</button>
						<button
						onClick={deletePost}
						className="block flex w-full text-left p-4 text-sm text-red-400 hover:bg-white/5"
						>
							<FiTrash size={20} className="mr-2" />
							Delete
                        </button>
                    </div>
                  )}
                </div>
			</div>
			
			<h1 className="w-full block text-xl text-gray-100 font-bold">{post?.title}</h1>
			
			{post.image_url &&
				<PostMedia
          href={post.image_url}
          src={post.image_url}
          alt={post.title ?? ""}
        />
			}
 
			<MarkdownContent content={post?.body} className="w-full text-base" />
			
			<div className="flex space-x-2">
				<div className="flex p-2 rounded-full bg-white/10">
					<button onClick={(e) => {votePost(1)}}>
						<FaRegThumbsUp className={`rounded-full hover:bg-white/10 hover:text-orange-400 ${userPostVote === 1 && "text-orange-400"}`}/>
					</button>
					
					<p className="mx-2 text-sm">
					  {post?.post_votes_view?.length
						? post.post_votes_view[0].upvotes - post.post_votes_view[0].downvotes
						: 0}
					</p>

					
					<button onClick={(e) => {votePost(-1)}}>
						<FaRegThumbsDown className={`rounded-full hover:bg-white/10 hover:text-blue-400 ${userPostVote === -1 && "text-blue-400"}`}/>
					</button>
				</div>
				
				<div className="flex p-2 rounded-full bg-white/10 hover:bg-white/20">
					<FiMessageCircle/>
					<p className="mx-2 text-sm">{post.post_replies_view?.length
						? post.post_replies_view[0].count
						: 0}</p>
				</div>
				
				<button onClick={() => copyLink(post.id)} className="flex p-2 rounded-full bg-white/10 hover:bg-white/20">
					<FaShare/>
					<p className="mx-2 text-sm">Share</p>
				</button>
			</div>
		</div>

    <form onSubmit={(e) => {e.preventDefault(); postComment()}} className="pt-2 space-y-2">
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Join the Conversation...`}
                className="w-full rounded-xl border border-gray-600 bg-transparent p-2.5 text-sm focus:border-gray-400 focus:outline-none min-h-30"
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
        userReplyVotes={userReplyVotes}
        onVoteReply={voteReply}
        onSubmitReply={(text, parentReplyId) => postComment(text, parentReplyId)}
      />
    ))}
		
	</div>
	{post.community_id ? 
		<CommunityInfo communityId={post.community_id} />
		: <></>
	}
	</> : <></> }
  </div>
  )
}
