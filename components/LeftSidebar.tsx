import Link from "next/link";
import { IoHomeOutline } from "react-icons/io5";
import { LuCircleArrowOutUpRight } from "react-icons/lu";
import { BsPeople } from "react-icons/bs";
import { PiChartBarFill } from "react-icons/pi";

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
	return (
		<section className="sticky top-0 w-72 h-screen overflow-y-hidden hover:overflow-y-scroll overflow-x-hidden overscroll-contain border-r-1 border-gray-600 py-5 px-5">
			{
				/* Main Navigation */
				SIDEBAR_ITEMS.map((item)=>{
					return (<Link className="flex relative rounded-md py-2 hover:bg-white/10" href={`/${item.title.toLowerCase()}`} key={item.title}>
						<div className="mx-2">
							<item.icon size={25}/>
						</div>
						<div>
							{item.title}
						</div>
					</Link>);
				})
			}
			
			<hr className="my-5 border-gray-700"/>
			
			{/* Community List */}
			<h6 className="text-sm text-gray-500 mb-3">COMMUNITIES</h6>
			
			{
				Array.from({length:20}).map((_,i)=>{
					return (<Link className="flex relative rounded-md py-2 hover:bg-white/10" href={`/community/${i}`} key={`${i}`}>
						<div className="mx-2">
							<div className="bg-slate-400 rounded-full w-5 h-5"></div>
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