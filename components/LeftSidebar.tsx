'use client'

import Link from "next/link";
import { createClient } from '@/utils/supabase/component';
import { FaPlus } from "react-icons/fa6"
import { IoHomeOutline } from "react-icons/io5";
import { LuCircleArrowOutUpRight } from "react-icons/lu";
import { BsPeople } from "react-icons/bs";
import { PiChartBarFill } from "react-icons/pi";
import { useModal } from '@/components/ModalProvider';
import { useState, useEffect } from 'react';

const SIDEBAR_ITEMS = [
	{
		title:'Home',
		link:'/',
		icon:IoHomeOutline
	},
	{
		title:'Popular',
		link:'/',
		icon:LuCircleArrowOutUpRight
	},
	{
		title:'Explore',
		link:'/explore',
		icon:BsPeople
	},
	{
		title:'All',
		link:'/',
		icon:PiChartBarFill
	}
]

type Join = {
  id: string
  user_id: string
  community_id: string
  communities: {
    name: string
  }
}

const LeftSidebar = ()=>{
	const { openCommunityCreator } = useModal()
	
	const supabase = createClient()
	const [joins, setJoins] = useState<Join[]>([])
	
	useEffect(() => {
		const load = async () => {	
			const { data: { user } } = await supabase.auth.getUser()
			
			if (!user) {
				return
			}		
			
			const { data } = await supabase
			.from('joins')
			.select(`
				*,
				communities (
					name
				)
			`)
			.eq('user_id', user.id)
			
			setJoins(data ?? [])
		}
		
		load();
	}, [supabase])
	
	return (
		<section className="sticky top-14 w-80 h-[calc(100vh-3.5rem)] overflow-y-hidden hover:overflow-y-scroll overflow-x-hidden overscroll-contain border-r-1 border-gray-600 p-5">
			{
				/* Main Navigation */
				SIDEBAR_ITEMS.map((item)=>{
					return (<Link className="flex relative rounded-md p-2 hover:bg-white/10" href={`${item.link.toLowerCase()}`} key={item.title}>
						<div className="ml-2 mr-4">
							<item.icon size={22}/>
						</div>
						<div>
							{item.title}
						</div>
					</Link>);
				})
			}
			
			<hr className="my-5 border-gray-700"/>
			
			{/* Community List */}
			<h6 className="text-sm text-gray-500 mb-3 mx-2">COMMUNITIES</h6>
			
			<button onClick={openCommunityCreator} className="w-full flex relative rounded-md p-2 hover:bg-white/10">
				<div className="ml-2 mr-4">
					<FaPlus size={22} />
				</div>
				<div>
					Create Community
				</div>
			</button>
			
			{
				joins.map((join)=>{
					return (<Link className="flex relative rounded-md p-2 hover:bg-white/10" href={`/community/${join.community_id}`} key={`${join.id}`}>
						<div className="ml-2 mr-4">
							<div className="bg-slate-400 rounded-full w-7 h-7"></div>
						</div>
						<div>
							{join.communities?.name ?? ""}
						</div>
					</Link>);
				})
			}
		</section>
	)
}

export default LeftSidebar