'use client'

import Link from "next/link";
import { FaRegThumbsUp, FaRegThumbsDown, FaShare } from "react-icons/fa6";
import { FiMessageCircle } from "react-icons/fi";
import { SlOptions } from "react-icons/sl";
import { createClient } from "@/utils/supabase/component"
import { useEffect, useState } from "react"
import { formatDistanceToNow } from 'date-fns';

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

type Props = {
	communityId?: string | null;
}

const PostsList = ({ communityId }: Props)=>{
	const supabase = createClient()
	const [posts, setPosts] = useState<Post[]>([])
	
	useEffect(() => {
		const loadPosts = async () => {
			const { data, error } = await supabase
				.from("posts")
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
				.order("created_at", { ascending: false })
			
			console.log(data)
			setPosts(data ?? [])
			
			if (error) {
				console.error("Error fetching posts:", error)
			}
		}
		
		const loadPostsFromCommunity = async () => {
			const { data, error } = await supabase
				.from("posts")
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
				.eq("community_id", communityId ?? "")
				.order("created_at", { ascending: false })
			
			console.log(data)
			setPosts(data ?? [])
			
			if (error) {
				console.error("Error fetching posts:", error)
			}
		}
		
		if(communityId){
			loadPostsFromCommunity()
		} else {
			loadPosts()
		}
	}, [supabase])
	
	const votePost = async (postId: string, voteType: number) => {
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return
		}
	  
		const { data, error } = await supabase
			.from("vote")
			.insert({
				user_id: user.id,
				post_id: postId,
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
	<main className="flex h-full min-h-screen flex-col w-full lg:max-w-2xl">
		{ posts.map((post)=>{
			return (
			<div className="border-t-1 border-gray-700" key={`${post.id}`}>
				<div className="p-3 space-y-2 rounded-xl hover:bg-white/10">
					<div className="flex text-sm space-x-2">
						<div className="bg-slate-400 rounded-full w-5 h-5"></div>
						<div className="mx-2">{post.users.username}</div>
						<div className="text-gray-400">•</div>
						<div className="text-gray-400">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</div>
						<div className="ml-auto p-2 rounded-full hover:bg-white/10"><SlOptions /></div>
					</div>
					
					<Link href={`/post/${post.id}`} className="w-full block text-lg text-gray-100 font-bold">{post.title}</Link>
					
					<Link href={`/post/${post.id}`} className="w-full">{post.body}</Link>
					
					<div className="flex space-x-2">
						<div className="flex p-2 rounded-full bg-white/10">
							<button onClick={(e) => votePost(post.id, 1)}>
								<FaRegThumbsUp className="rounded-full hover:bg-white/10 hover:text-orange-700"/>
							</button>
							
							<p className="mx-2 text-sm">
							  {post.post_votes_view?.length
								? post.post_votes_view[0].upvotes - post.post_votes_view[0].downvotes
								: 0}
							</p>

							
							<button onClick={(e) => votePost(post.id, -1)}>
								<FaRegThumbsDown className="rounded-full hover:bg-white/10 hover:text-blue-700"/>
							</button>
						</div>
						
						<Link href={`/post/${post.id}`} className="flex p-2 rounded-full bg-white/10 hover:bg-white/20">
							<FiMessageCircle/>
							<p className="mx-2 text-sm">{post.post_replies_view?.length
								? post.post_replies_view[0].count
								: 0}</p>
						</Link>
						
						<button onClick={() => copyLink(post.id)} className="flex p-2 rounded-full bg-white/10 hover:bg-white/20">
							<FaShare/>
							<p className="mx-2 text-sm">Share</p>
						</button>
					</div>
				</div>
			</div>
			);
		})}
	</main>
	)
}

export default PostsList