'use client'

import Link from "next/link";
import PostsList from '@/components/PostsList';
import CommunityInfo from '@/components/CommunityInfo';
import { useState, useEffect, useRef } from 'react';
import { FaPlus } from "react-icons/fa6";
import { LuPencil } from "react-icons/lu";
import { SlOptions } from "react-icons/sl";

import { getUser, type User } from '@/utils/queries/users'

export default function UserPage(props: { params: Promise<{ id: string }> }) {
	const [user, setUser] = useState<User | null>(null)
		
	useEffect(() => {
		const load = async () => {
			const { id } = await props.params

			const { data: fetched_user } = await getUser(id);
			setUser(fetched_user)
		}

		load()
	}, [props.params])
	
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
