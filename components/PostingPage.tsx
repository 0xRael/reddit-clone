'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/component'
import { IoIosArrowDown } from "react-icons/io";

export default function PostingPage() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const supabase = createClient()

	// Form states
	const [title, setTitle] = useState('')
	const [body, setBody] = useState('')
	const [communityId, setCommunityId] = useState<string | null>(null)
	const [communityName, setCommunityName] = useState<string | null>(null)
  
	// Dropdown states
	const [joinedCommunities, setJoinedCommunities] = useState<any[]>([])
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)

	// 1. Fetch initial community from URL (if any)
	useEffect(() => {
	const id = searchParams.get('community')
	setCommunityId(id)

	async function fetchCommunity() {
		if (!id) return;
		const { data, error } = await supabase
			.from('communities')
			.select('name')
			.eq('id', id)
			.single()

		if (error) {
			console.error('Error fetching community:', error)
		} else {
			setCommunityName(data.name)
		}
	}

	fetchCommunity()
	}, [searchParams, supabase])

	// 2. Fetch the list of communities the user has joined
	useEffect(() => {
		const loadCommunities = async () => {  
			const { data: { user } } = await supabase.auth.getUser()
			
			if (!user) return;
			
			const { data, error } = await supabase
				.from('joins')
				.select(`
					community_id,
					communities (
						name
					)
				`)
				.eq('user_id', user.id)
			
			if (error) {
				console.error('Error fetching joined communities:', error)
			} else {
				setJoinedCommunities(data ?? [])
			}
		}
		
		loadCommunities();
	}, [supabase])
  
  async function post() {
    const { data: { user } } = await supabase.auth.getUser()
	if (!user) {
		return
	}
	
	const { data, error } = await supabase
        .from("posts")
        .insert({
			title: title,
			body: body,
			user_id: user.id,
			community_id: communityId
		})
		
	if (error) {
		console.error("An error ocurred when posting:", error);
	} else {
		router.push("/");
	}
  }
  
  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault()
		  post()
        }}
		className="w-full max-w-2xl space-y-4"
      >
		<h1 className="text-2xl font-bold">Create post</h1>
		
		{/* Dropdown Container */}
		<div className="relative inline-block z-10">
			<button 
				type="button" 
				onClick={() => setIsDropdownOpen(!isDropdownOpen)}
				className="flex p-2 rounded-full bg-white/10 hover:bg-white/20 space-x-2 items-center"
			>
				{communityName ? (
					<>
						<div className="bg-slate-400 rounded-full w-6 h-6"></div>
						<span className="font-medium pr-2">{communityName}</span>
					</>
				) : (
					<span className="font-medium px-2">Choose a community</span>
				)}
				<IoIosArrowDown />
			</button>

			{/* Dropdown Menu */}
			{isDropdownOpen && (
				<div className="absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-20">
					{joinedCommunities.length === 0 ? (
						<div className="p-4 text-sm text-gray-400">You haven't joined any communities yet.</div>
					) : (
						joinedCommunities.map((join, index) => (
							<button
								key={index}
								type="button"
								onClick={() => {
									setCommunityId(join.community_id);
									setCommunityName(join.communities.name);
									setIsDropdownOpen(false); // Close dropdown after selection
								}}
								className="w-full text-left p-3 hover:bg-white/10 flex items-center space-x-3 transition-colors"
							>
								<div className="bg-slate-400 rounded-full w-8 h-8 shrink-0"></div>
								<span className="font-medium truncate">{join.communities.name}</span>
							</button>
						))
					)}
				</div>
			)}
		</div>
				
		{/* Post Options */}
		<div className="mt-7 space-x-5 text-white">
			<button type="button" className="p-3 border-blue-400 border-b-4 hover:bg-white/10">Text</button>
			<button type="button"  className="p-3 hover:bg-white/10">Images & Video</button>
			<button type="button"  className="p-3 hover:bg-white/10">Link</button>
			<button type="button"  className="p-3 hover:bg-white/10">Poll</button>
		</div>
		
		<input
			placeholder="Title"
			type="text"
			required
			onChange={(e) => setTitle(e.target.value)}
			className="block p-3 border-gray-700 hover:border-gray-500 hover:bg-white/5 border-1 rounded-xl w-full max-w-2xl placeholder:text-gray-400"
			/>
		
		<textarea
			placeholder="Body Text"
			onChange={(e) => setBody(e.target.value)}
			className="block p-3 border-gray-700 hover:border-gray-500 hover:bg-white/5 border-1 rounded-xl w-full max-w-2xl placeholder:text-gray-400"
			/>
		
		<div className="flex">
			<div className="w-full"></div>
			<button type="submit" className="py-3 px-5 rounded-full bg-white/10 hover:bg-white/20">Post</button>
		</div>
      </form>
    </div>
  )
}