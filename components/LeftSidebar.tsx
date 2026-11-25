'use client'

import Link from "next/link";
import { FaPlus } from "react-icons/fa6"
import { FaTimes, FaBars } from "react-icons/fa"
import { IoHomeOutline } from "react-icons/io5";
import { LuCircleArrowOutUpRight } from "react-icons/lu";
import { BsPeople } from "react-icons/bs";
import { PiChartBarFill } from "react-icons/pi";
import { useModal } from '@/components/ModalProvider';
import { useState, useEffect } from 'react';

import { getOwnedCommunities, getJoinedCommunities, type Community } from '@/utils/queries/communities'

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

const CommunityLink = ({community} : {community: {id:string|null, name:string|null, icon_url:string|null}})=>{
  return (
    <Link 
		  className="flex items-center relative rounded-md p-2 hover:bg-white/10" 
		  href={`/community/${community.id}`} 
	  >
		  <div className="ml-2 mr-4 shrink-0">
			  <div className="bg-slate-400 rounded-full w-7 h-7 overflow-hidden flex items-center justify-center">
				  {community.icon_url ? (
					  <img 
						  src={community.icon_url} 
						  alt={community.name ?? "Community icon"} 
						  className="w-full h-full object-cover"
					  />
				  ) : null}
			  </div>
		  </div>
		  <div className="truncate">
			  {community.name ?? ""}
		  </div>
		  </Link>
  )
}

const LeftSidebar = ()=>{
	const { openCommunityCreator } = useModal()
	
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [joins, setJoins] = useState<Community[]>([])
  const [ownedCommunities, setOwnedCommunities] = useState<Community[]>([])
	
	function toggleSidebar () {
		setIsOpen(!isOpen);
	}
	
	useEffect(() => {
		const load = async () => {				
			const { data } = await getJoinedCommunities();
			setJoins(data)

      const { data: communities } = await getOwnedCommunities();
      setOwnedCommunities(communities)
		}
		
		load();
	}, [])
	
	return (
		<>
		<button
		  onClick={toggleSidebar}
		  className="fixed top-2 left-2 z-50 p-2 text-white rounded-md xl:hidden"
		>
		  {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
		</button>
		<section className={`xl:sticky transition-transform duration-400 max-xl:fixed bg-background max-lg:-ml-4 max-lg:pl-4 max-xl:z-2 ${isOpen ? '' : 'max-xl:-translate-x-80  '} top-14 w-80 h-[calc(100vh-3.5rem)] overflow-y-hidden hover:overflow-y-scroll overflow-x-hidden overscroll-contain border-r-1 border-gray-600 p-5`}>			
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
			
      <button onClick={() => openCommunityCreator()} className="w-full flex relative rounded-md p-2 cursor-pointer hover:bg-white/10">
				<div className="ml-2 mr-4">
					<FaPlus size={22} />
				</div>
				<div>
					Create Community
				</div>
			</button>

      {ownedCommunities.length > 0 && <><hr className="my-5 border-gray-700"/>
			<h6 className="text-sm text-gray-500 mb-3 mx-2">MODERATION</h6>
			
			{
				ownedCommunities.map((community)=><CommunityLink key={community.id} community={community} />)
			}</>}

			{joins.length > 0 && <><hr className="my-5 border-gray-700"/>
			<h6 className="text-sm text-gray-500 mb-3 mx-2">JOINED COMMUNITIES</h6>
			
			{
				joins.map((community)=>(<CommunityLink key={community.id} community={community} />))
			}</>}
		</section>
		</>
	)
}

export default LeftSidebar
