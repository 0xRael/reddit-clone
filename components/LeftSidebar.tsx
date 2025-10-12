'use client'

import Link from "next/link";
import { FaPlus } from "react-icons/fa6"
import { IoHomeOutline } from "react-icons/io5";
import { LuCircleArrowOutUpRight } from "react-icons/lu";
import { BsPeople } from "react-icons/bs";
import { PiChartBarFill } from "react-icons/pi";
import { useModal } from '@/components/ModalProvider'

const SIDEBAR_ITEMS = [
	{
		title:'Home',
		icon:IoHomeOutline
	},
	{
		title:'Popular',
		icon:LuCircleArrowOutUpRight
	},
	{
		title:'Explore',
		icon:BsPeople
	},
	{
		title:'All',
		icon:PiChartBarFill
	}
]

const LeftSidebar = ()=>{
	const { openCommunityCreator } = useModal()
	
	return (
		<section className="sticky top-14 w-80 h-[calc(100vh-3.5rem)] overflow-y-hidden hover:overflow-y-scroll overflow-x-hidden overscroll-contain border-r-1 border-gray-600 p-5">
			{
				/* Main Navigation */
				SIDEBAR_ITEMS.map((item)=>{
					return (<Link className="flex relative rounded-md p-2 hover:bg-white/10" href={`/${item.title.toLowerCase()}`} key={item.title}>
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
				Array.from({length:20}).map((_,i)=>{
					return (<Link className="flex relative rounded-md p-2 hover:bg-white/10" href={`/community/${i}`} key={`${i}`}>
						<div className="ml-2 mr-4">
							<div className="bg-slate-400 rounded-full w-7 h-7"></div>
						</div>
						<div>
							Community {i}
						</div>
					</Link>);
				})
			}
		</section>
	)
}

export default LeftSidebar