"use client"

import { createClient } from '@/utils/supabase/component'
import { FaRegThumbsUp, FaRegThumbsDown, FaShare } from "react-icons/fa6";
import { FiMessageCircle } from "react-icons/fi";
import { SlOptions } from "react-icons/sl";
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react'

type Post = {
  id: string
  title: string | null
  body: string | null
  created_at: string
  users: {
    username: string
  }
  communities: {
    name: string | null
  }
  post_votes_view: {upvotes: number,downvotes: number}[],
  post_replies_view: {count: number}[]
}

type Reply = {
	id: string,
	user_id: string,
	post_id: string | null,
	reply_id: string | null,
	text: string,
	users: {
		username: string
	}
}

export default function PostPage(props: { params: Promise<{ id: string }> }) {
	const supabase = createClient()
	const [post, setPost] = useState<Post | null>(null)
	const [replies, setReplies] = useState<Reply[]>([])
	const [comment, setComment] = useState('')
	
	useEffect(() => {
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
				name
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
		
		setPost(fetched_post)
		
		const { data: fetched_replies } = await supabase
		.from('replies')
		.select(`
			*,
			users (
				username
			)
		`)
		.eq('post_id', id)
		
		setReplies(fetched_replies)
    }

    loadPost()
	}, [supabase])
	
	async function postComment() {
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return
		}

		const { data, error } = await supabase
			.from("replies")
			.insert({
				text: comment,
				user_id: user.id,
				post_id: post.id
			})
			
		if (error) {
			console.error("An error ocurred when commenting:", error);
		} else {
			router.push("/");
		}
	}
	
	const votePost = async (voteType: number) => {
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return
		}
	  
		const { data, error } = await supabase
			.from("vote")
			.insert({
				user_id: user.id,
				post_id: post.id,
				type: voteType
			})
		
		if (error) {
			console.error("Error voting:", error)
		}
	}
	
	const voteReply = async (replyId: string, voteType: number) => {
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return
		}
	  
		const { data, error } = await supabase
			.from("vote")
			.insert({
				user_id: user.id,
				reply_id: replyId,
				type: voteType
			})
		
		if (error) {
			console.error("Error voting:", error)
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
	
  return (
  <div className="w-full h-full justify-center flex relative">
	{ post ? <div className="w-full max-w-3xl">
		<div className="space-y-2 py-3">
			<div className="flex text-sm space-x-2">
				<div className="bg-slate-400 rounded-full w-8 h-8"></div>
				<div className="mx-2">{post?.users.username}</div>
				<div className="text-gray-400">•</div>
				<div className="text-gray-400">{formatDistanceToNow(new Date(post?.created_at), { addSuffix: true })}</div>
				<div className="ml-auto p-2 rounded-full hover:bg-white/10"><SlOptions /></div>
			</div>
			
			<h1 className="w-full block text-xl text-gray-100 font-bold">{post?.title}</h1>
			
			<p className="w-full">{post?.body}</p>
			
			<div className="flex space-x-2">
				<div className="flex p-2 rounded-full bg-white/10">
					<button onClick={(e) => {votePost(1)}}>
						<FaRegThumbsUp className="rounded-full hover:bg-white/10 hover:text-orange-700"/>
					</button>
					
					<p className="mx-2 text-sm">
					  {post?.post_votes_view?.length
						? post.post_votes_view[0].upvotes - post.post_votes_view[0].downvotes
						: 0}
					</p>

					
					<button onClick={(e) => {votePost(-1)}}>
						<FaRegThumbsDown className="rounded-full hover:bg-white/10 hover:text-blue-700"/>
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
		
		<form className="w-full"
		  onSubmit={(e) => {
          e.preventDefault()
		  postComment()
        }}>
			<input
			  placeholder="Join the conversation"
			  onChange={(e) => setComment(e.target.value)}
			  className="hover:bg-white/10 w-full border-gray-600 hover:border-gray-400 border-1 p-3 px-5 rounded-full"
			/>
			
			<div className="flex">
				<div className="w-full"></div>
				<button type="submit" className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-sm">
					Comment
				</button>
			</div>
		</form>
		
		{
			/* Comments */
			replies.map((reply)=>{
				return (
				<div className="ml-4 mb-8 border-l-1 border-gray-700 px-5 space-y-2" key={`${reply.id}`}>
					<div className="flex text-sm space-x-2 relative -left-9">
						<div className="bg-slate-400 rounded-full w-8 h-8"></div>
						<div>{reply.users.username}</div>
						<div className="text-gray-400">•</div>
						<div className="text-gray-400">{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</div>
					</div>
					
					<p className="w-full">{reply.text}</p>
					
					<div className="flex space-x-2 text-gray-300">
						<div className="flex p-2">
							<button onClick={(e) => voteReply(reply.id, 1)}>
								<FaRegThumbsUp className="rounded-full hover:bg-white/10 hover:text-orange-700"/>
							</button>
							
							<p className="mx-2 text-sm">
							{/*{post.post_votes_view?.length
								? post.post_votes_view[0].upvotes - post.post_votes_view[0].downvotes
							: 0}*/}00
							</p>

							
							<button onClick={(e) => voteReply(reply.id, -1)}>
								<FaRegThumbsDown className="rounded-full hover:bg-white/10 hover:text-blue-700"/>
							</button>
						</div>
						
						<div className="flex p-2 rounded-full hover:bg-white/10">
							<FiMessageCircle/>
							<p className="mx-2 text-sm">Reply</p>
						</div>
						
						<div className="flex p-2 rounded-full hover:bg-white/10">
							<FaShare/>
							<p className="mx-2 text-sm">Share</p>
						</div>
						
						<div className="p-2 rounded-full hover:bg-white/10"><SlOptions /></div>
					</div>
				</div>
				);
			})
		}
		
	</div> : <div></div> }
  </div>
  )
}
