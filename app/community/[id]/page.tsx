'use client'

import Link from "next/link";
import { createClient } from '@/utils/supabase/component';
import PostsList from '@/components/PostsList';
import CommunityInfo from '@/components/CommunityInfo';
import { useState, useEffect, useRef } from 'react';
import { FaPlus } from "react-icons/fa6";
import { LuPencil } from "react-icons/lu";
import { SlOptions } from "react-icons/sl";

import { Community } from '@/types'

export default function CommunityPage(props: { params: Promise<{ id: string }> }) {
	const supabase = createClient()
	
	const [community, setCommunity] = useState<Community | null>(null)
	const [isOwner, setIsOwner] = useState(false)
	const [uploadingBanner, setUploadingBanner] = useState(false)
	const [uploadingIcon, setUploadingIcon] = useState(false)

	const bannerInputRef = useRef<HTMLInputElement>(null)
	const iconInputRef = useRef<HTMLInputElement>(null)
		
	useEffect(() => {
		const load = async () => {
			const { id } = await props.params
			const { data: { user } } = await supabase.auth.getUser()

			const { data: fetched_community } = await supabase
				.from('communities')
				.select('*')
				.eq('id', id)
				.single<Community>()
			
			if (fetched_community) {
				setCommunity(fetched_community)
				if (user && user.id === fetched_community.owner_id) {
					setIsOwner(true)
				}
			}
		}

		load()
	}, [props.params, supabase])

	const handleImageUpload = async (file: File, type: 'banner' | 'icon') => {
		if (!community) return
		if (file.size > 3 * 1024 * 1024) {
			alert("Image must be under 3MB")
			return
		}

		const setUploading = type === 'banner' ? setUploadingBanner : setUploadingIcon
		setUploading(true)

		const filePath = `${community.id}/${type}`

		// Upload file to community_assets bucket
		const { error: uploadError } = await supabase.storage
			.from('community_assets')
			.upload(filePath, file, { upsert: true })

		if (uploadError) {
			console.error(`Error uploading ${type}:`, uploadError)
			alert(`Failed to upload ${type}`)
			setUploading(false)
			return
		}

		// 2. Get Public URL with cache-busting timestamp
		const { data } = supabase.storage.from('community_assets').getPublicUrl(filePath)
		const publicUrl = `${data.publicUrl}?t=${Date.now()}`

		// 3. Update Communities table
		const updatePayload = type === 'banner' ? { banner_url: publicUrl } : { icon_url: publicUrl }
		
		const { error: dbError } = await supabase
			.from('communities')
			.update(updatePayload)
			.eq('id', community.id)

		if (!dbError) {
			setCommunity(prev => prev ? { ...prev, ...updatePayload } : null)
		}

		setUploading(false)
	}
	
	const join = async () => {
		const { id } = await props.params
		
		const { data: { user } } = await supabase.auth.getUser()
		
		if (!user) {
			return
		}
	  
		const { data, error } = await supabase
			.from("joins")
			.insert({
				user_id: user.id,
				community_id: id
			})
		
		if (error) {
			console.error("Error joining:", error)
		}
	}
	
	return (
		<div className="w-full h-full justify-center">
		{ community ? <>
			{/* Hidden File Inputs for Banner and Icon */}
			{isOwner && (
				<>
					<input 
						type="file" 
						ref={bannerInputRef} 
						accept="image/*" 
						className="hidden" 
						onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')}
					/>
					<input 
						type="file" 
						ref={iconInputRef} 
						accept="image/*" 
						className="hidden" 
						onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'icon')}
					/>
				</>
			)}

			<div className="block w-full max-w-5xl mx-auto">
				{/* Community Banner */}
				<div 
					onClick={() => isOwner && bannerInputRef.current?.click()}
					className={`w-full h-32 bg-slate-600 rounded-lg relative overflow-hidden group ${isOwner ? 'cursor-pointer' : ''}`}
				>
					{community.banner_url && (
						<img 
							src={community.banner_url} 
							alt="Community Banner" 
							className="w-full h-full object-cover" 
						/>
					)}
					{/* Owner Hover Overlay for Banner */}
					{isOwner && (
						<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white space-x-2">
							<LuPencil size={18} />
							<span className="text-sm font-semibold">
								{uploadingBanner ? "Uploading..." : "Change Banner"}
							</span>
						</div>
					)}
				</div>

				{/* Community Header Bar */}
				<div className="w-full flex h-10 my-3 ml-2 space-x-2">
					{/* Community Icon */}
					<div 
						onClick={() => isOwner && iconInputRef.current?.click()}
						className={`bg-slate-400 relative -top-10 rounded-full border-neutral-900 border-4 w-20 h-20 overflow-hidden shrink-0 group ${isOwner ? 'cursor-pointer' : ''}`}
					>
						{community.icon_url ? (
							<img 
								src={community.icon_url} 
								alt="Community Icon" 
								className="w-full h-full object-cover" 
							/>
						) : null}
						{/* Owner Hover Overlay for Icon */}
						{isOwner && (
							<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
								<LuPencil size={16} />
							</div>
						)}
					</div>

					<h1 className="text-xl text-gray-100 font-bold">{community.name}</h1>
					
					<Link href={`/submit?community=${community.id}`} className="ml-auto flex rounded-full p-2 border-gray-700 hover:border-gray-500 border-1 space-x-2">
						<FaPlus size={22} />
						<div>Create Post</div>
					</Link>
					<button onClick={join} className="rounded-full p-2 px-4 bg-blue-800 hover:bg-blue-600">
						Join
					</button>
					<Link href={`/submit?community=${community.id}`} className="rounded-full p-2 border-gray-700 hover:border-gray-500 border-1 space-x-2">
						<SlOptions size={22} />
					</Link>
				</div>
			</div>
			
			<div className="w-full h-full justify-center flex relative">
				<PostsList communityId={community.id} />
				<CommunityInfo communityId={community.id} />
			</div>
		</> : <></> }
		</div>
	)
}