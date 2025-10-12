'use client'

import Link from "next/link";
import { createClient } from '@/utils/supabase/component';
import PostsList from '@/components/PostsList';
import CommunityInfo from '@/components/CommunityInfo';
import { useState, useEffect } from 'react';
import { FaPlus } from "react-icons/fa6";
import { SlOptions } from "react-icons/sl";

type Community = {
  id: string
  name: string | null
  description: string | null
  created_at: string,
  owner_id: string
}

export default function CommunityPage(props: { params: Promise<{ id: string }> }) {
	const supabase = createClient()
	
	const [community, setCommunity] = useState<Community | null>(null)
	
	useEffect(() => {
		const load = async () => {
			const { id } = await props.params
			
			const { data: fetched_community } = await supabase
			.from('communities')
			.select(`
				*
			`)
			.eq('id', id)
			.single<Community>()
			
			setCommunity(fetched_community)
		}

		load()
	}, [supabase])
	
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
			<div className="block w-full max-w-5xl mx-auto">
				<div className="w-full h-30 bg-slate-600 rounded-lg"></div>
				<div className="w-full flex h-10 my-3 ml-2 space-x-2">
					<div className="bg-slate-400 relative -top-10 rounded-full border-neutral-900 border-5 w-20 h-20"></div>
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