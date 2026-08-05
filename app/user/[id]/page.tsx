'use client'

import Link from "next/link";
import { createClient } from '@/utils/supabase/component';
import PostsList from '@/components/PostsList';
import CommunityInfo from '@/components/CommunityInfo';
import { useState, useEffect, useRef } from 'react';
import { FaPlus } from "react-icons/fa6";
import { LuPencil } from "react-icons/lu";
import { SlOptions } from "react-icons/sl";

import { User } from '@/types'

export default function UserPage(props: { params: Promise<{ id: string }> }) {
	const supabase = createClient()
	
	const [user, setUser] = useState<User | null>(null)
		
	useEffect(() => {
		const load = async () => {
			const { id } = await props.params
			const { data: { user } } = await supabase.auth.getUser()

			const { data: fetched_user } = await supabase
				.from('users')
				.select('*')
				.eq('id', id)
				.single<User>()
			
			if (fetched_user) {
				setUser(fetched_user)
			}
		}

		load()
	}, [props.params, supabase])
	
	return (
		<div className="w-full h-full justify-center">
		{ user ? <>			
			<div className="w-full h-full justify-center flex relative">
				<div>
					{/* User Header Bar */}
					<div className="w-full flex h-10 my-3 ml-2 space-x-2">
						{/* User Icon */}
						<div 
							className={`bg-slate-400 relative rounded-full w-14 h-14 overflow-hidden shrink-0 group`}
						>
						</div>

						<h1 className="text-xl mt-3 text-gray-100 font-bold">{user.username}</h1>
					</div>
					<PostsList userId={user.id} />
				</div>
			</div>
		</> : <></> }
		</div>
	)
}