import Link from "next/link";
import { FaRegThumbsUp, FaRegThumbsDown, FaShare } from "react-icons/fa6";
import { FiMessageCircle } from "react-icons/fi";
import { SlOptions } from "react-icons/sl";

const MainComponent = ()=>{
	return (
	<main className="flex h-full min-h-screen flex-col w-full max-w-2xl">
		{ Array.from({length:5}).map((_,i)=>{
			return (
			<div className="border-t-1 border-gray-700">
				<div className="p-3 space-y-2 rounded-xl hover:bg-white/10">
					<div className="flex text-sm space-x-2">
						<div className="bg-slate-400 rounded-full w-5 h-5"></div>
						<div className="mx-2">Community Name</div>
						<div className="text-gray-400">•</div>
						<div className="text-gray-400">40 min. ago</div>
						<div className="ml-auto p-2 rounded-full hover:bg-white/10"><SlOptions /></div>
					</div>
					
					<h1 className="text-lg text-gray-100 font-bold">Post Title Goes Here</h1>
					
					<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
					
					<div className="flex space-x-2">
						<div className="flex p-2 rounded-full bg-white/10">
							<FaRegThumbsUp className="rounded-full hover:bg-white/10 hover:text-orange-700"/>
							<p className="mx-2 text-sm">00</p>
							<FaRegThumbsDown className="rounded-full hover:bg-white/10 hover:text-blue-700"/>
						</div>
						
						<div className="flex p-2 rounded-full bg-white/10 hover:bg-white/20">
							<FiMessageCircle/>
							<p className="mx-2 text-sm">00</p>
						</div>
						
						<div className="flex p-2 rounded-full bg-white/10 hover:bg-white/20">
							<FaShare/>
							<p className="mx-2 text-sm">Share</p>
						</div>
					</div>
				</div>
			</div>
			);
		})}
	</main>
	)
}

export default MainComponent