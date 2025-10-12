'use client'

import Link from "next/link";
import { createClient } from '@/utils/supabase/component';
import { useState, useEffect } from 'react';
import { LuCakeSlice } from "react-icons/lu";
import { format } from 'date-fns'

type Community = {
  id: string
  name: string | null
  description: string | null
  created_at: string,
  owner_id: string
}

type Props = {
	communityId: string;
}

const CommunityInfo = ({ communityId }: Props) => {
	const supabase = createClient()
	const [community, setCommunity] = useState<Community | null>(null)
	
	useEffect(() => {
		const load = async () => {			
			const { data: fetched_community } = await supabase
			.from('communities')
			.select(`
				*
			`)
			.eq('id', communityId)
			.single<Community>()
			
			setCommunity(fetched_community)
		}
		
		load();
	}, [supabase, communityId])
	
	if(!communityId) return;
	
	return (
		<>
		{ community ?
			<section className="sticky top-14 w-74 h-[calc(100vh-3.5rem)] overflow-y-hidden hover:overflow-y-scroll overflow-x-hidden overscroll-contain py-5 ml-5">
				<div className="bg-black text-gray-400 rounded-xl w-full p-5 space-y-2">
					<Link href={`/community/${communityId}`} className="text-sm text-gray-500 mb-3">{community.name}</Link>
					
					<p>{community.description}</p>
					
					<div className="flex space-x-2">
						<LuCakeSlice />
						<div>Created {format(new Date(community.created_at), 'MMM d, yyyy')}</div>
					</div>
				</div>
			</section>
		: <></> }
		</>
	);
}

export default CommunityInfo