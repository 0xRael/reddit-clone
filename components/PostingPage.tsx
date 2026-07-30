'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/component'
import { IoIosArrowDown } from "react-icons/io";

import { Join } from '@/types'

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB in bytes

export default function PostingPage() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const supabase = createClient()

	// Form states
	const [title, setTitle] = useState('')
	const [body, setBody] = useState('')
	const [communityId, setCommunityId] = useState<string | null>(null)
	const [communityName, setCommunityName] = useState<string | null>(null)
	const [communityIcon, setCommunityIcon] = useState<string | null>(null)

	const [imageFile, setImageFile] = useState<File | null>(null)
	const [isUploading, setIsUploading] = useState<boolean>(false)
	const fileInputRef = useRef<HTMLInputElement | null>(null)
  
	// Dropdown states
	const [joinedCommunities, setJoinedCommunities] = useState<Join[]>([])
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)

	// 1. Fetch initial community from URL (if any)
	useEffect(() => {
	const id = searchParams.get('community')
	setCommunityId(id)

	async function fetchCommunity() {
		if (!id) return;
		const { data, error } = await supabase
			.from('communities')
			.select('name, icon_url')
			.eq('id', id)
			.single()

		if (error) {
			console.error('Error fetching community:', error)
		} else {
			setCommunityName(data.name)
			setCommunityIcon(data.icon_url)
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
					*,
					communities (
						name,
						icon_url
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
    setIsUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        setIsUploading(false)
        return;
    }
    
    let imageUrl = null

    if (imageFile) {
        // Grab the extension (e.g. .png) and create a unique filename using Date.now()
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        // Storing them in a folder named after the user's ID keeps the bucket organized
        const filePath = `${user.id}/${fileName}` 

        const { error: uploadError } = await supabase.storage
            .from('post_images')
            .upload(filePath, imageFile)
            
        if (uploadError) {
            console.error("Error uploading image:", uploadError)
            alert("Failed to upload image.")
            setIsUploading(false)
            return
        }
        
        // Get the public URL from the bucket
        const { data } = supabase.storage
            .from('post_images')
            .getPublicUrl(filePath)
            
        imageUrl = data.publicUrl
    }
    
    // Save the post to the database (now including the imageUrl)
    const { error } = await supabase
        .from("posts")
        .insert({
            title: title,
            body: body,
            user_id: user.id,
            community_id: communityId,
            image_url: imageUrl 
        })
        
    if (error) {
        console.error("An error ocurred when posting:", error);
        setIsUploading(false)
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
						<div className="shrink-0">
							<div className="bg-slate-400 rounded-full w-6 h-6 overflow-hidden flex items-center justify-center">
								{communityIcon ? (
									<img 
										src={communityIcon} 
										alt={communityName ?? "Community icon"} 
										className="w-full h-full object-cover"
									/>
								) : null}
							</div>
						</div>
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
					{/* "No Community" Option */}
					<button
						type="button"
						onClick={() => {
							setCommunityId(null);
							setCommunityName(null);
							setCommunityIcon(null);
							setIsDropdownOpen(false);
						}}
						className="w-full text-left p-3 hover:bg-white/10 flex items-center space-x-3 transition-colors border-b border-gray-800"
					>
						<div className="bg-slate-600 rounded-full w-8 h-8 shrink-0 flex items-center justify-center text-xs">✕</div>
						<span className="font-medium text-gray-300">No community (Post to profile)</span>
					</button>

					{/* Joined Communities List */}
					{joinedCommunities.map((join, index) => (
						<button
							key={index}
							type="button"
							onClick={() => {
								setCommunityId(join.community_id);
								setCommunityName(join.communities.name);
								setCommunityIcon(join.communities.icon_url);
								setIsDropdownOpen(false);
							}}
							className="w-full text-left p-3 hover:bg-white/10 flex items-center space-x-3 transition-colors"
						>
							<div className="shrink-0">
								<div className="bg-slate-400 rounded-full w-8 h-8 overflow-hidden flex items-center justify-center">
									{join.communities?.icon_url ? (
										<img 
											src={join.communities?.icon_url} 
											alt={join.communities?.name ?? "Community icon"} 
											className="w-full h-full object-cover"
										/>
									) : null}
								</div>
							</div>
							<span className="font-medium truncate">{join.communities.name}</span>
						</button>
					))}
				</div>
			)}
		</div>
				
		{/* Hidden File Input */}
		<input 
			type="file" 
			ref={fileInputRef}
			accept="image/*"
			className="hidden" 
			onChange={(e) => {
				const selectedFile = e.target.files?.[0]
				if (!selectedFile) return

				// Check if file size exceeds 3MB
				if (selectedFile.size > MAX_FILE_SIZE) {
					alert("File is too large! Please choose an image under 3MB.")
					e.target.value = '' // Reset the input value so selecting the same file again triggers onChange
					return
				}

				setImageFile(selectedFile)
			}}
		/>

		{/* Post Options */}
		<div className="mt-7 space-x-5 text-white border-b border-gray-700 flex items-center">
			<button type="button" className="p-3 border-blue-400 border-b-2 hover:bg-white/10 font-medium">
				Text
			</button>
			
			{/* Images & Video Button - Triggers hidden file input */}
			<button 
				type="button" 
				onClick={() => fileInputRef.current?.click()}
				className="p-3 hover:bg-white/10 text-gray-400 flex items-center space-x-2"
			>
				<span>Images & Video</span>
				{imageFile && (
					<span className="text-xs bg-blue-600 text-white pl-2 pr-1 py-0.5 rounded-full flex items-center space-x-1 max-w-[160px]">
						<span className="truncate">{imageFile.name}</span>
						<span 
							role="button"
							onClick={(e) => {
								e.stopPropagation() // Prevents opening the file picker again!
								setImageFile(null)
								if (fileInputRef.current) {
									fileInputRef.current.value = '' // Clears the native input
								}
							}}
							className="hover:bg-blue-700/80 rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] font-bold text-white transition-colors cursor-pointer"
							title="Remove image"
						>
							✕
						</span>
					</span>
				)}
			</button>
			
			<button type="button" className="p-3 hover:bg-white/10 text-gray-400">Link</button>
			<button type="button" className="p-3 hover:bg-white/10 text-gray-400">Poll</button>
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