'use client'

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
}

const PostsList = ()=>{
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
					)
				`)
				.order("created_at", { ascending: false })
			
			console.log(data)
			setPosts(data)
			
			if (error) {
				console.error("Error fetching posts:", error)
			}
		}
		
		loadPosts()
	}, [supabase])
	
	return (
	<main className="flex h-full min-h-screen flex-col w-full max-w-2xl">
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
					
					<h1 className="text-lg text-gray-100 font-bold">{post.title}</h1>
					
					<p>{post.body}</p>
					
					<div className="flex space-x-2">
						<div className="flex p-2 rounded-full bg-white/10">
							<FaRegThumbsUp className="rounded-full hover:bg-white/10 hover:text-orange-700"/>
							<p className="mx-2 text-sm">00</p>
							<FaRegThumbsDown className="rounded-full hover:bg-white/10 hover:text-blue-700"/>
						</div>
						
						<div className="flex p-2 rounded-full bg-white/10 hover:bg-white/20">
							<FiMessageCircle/>
							<p className="mx-2 text-sm">00</p>
						</div>
						
						<div className="flex p-2 rounded-full bg-white/10 hover:bg-white/20">
							<FaShare/>
							<p className="mx-2 text-sm">Share</p>
						</div>
					</div>
				</div>
			</div>
			);
		})}
	</main>
	)
}

export default PostsList