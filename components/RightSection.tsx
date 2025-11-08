const RightSection = () => {
	return (
		<section className="lg:sticky max-lg:hidden top-14 w-74 h-[calc(100vh-3.5rem)] overflow-y-hidden hover:overflow-y-scroll overflow-x-hidden overscroll-contain py-5 ml-5">
			<div className="bg-black text-gray-400 rounded-xl w-full py-5">
				<h6 className="text-sm text-gray-500 mb-3 mx-5">RECENT POSTS</h6>
				{
				Array.from({length:20}).map((_,i)=>{
					return (<div className="space-y-2 border-b-1 border-gray-700 px-5 py-3" key={`${i}`}>
						<div className="flex text-sm space-x-2">
							<div className="bg-slate-400 rounded-full w-5 h-5"></div>
							<div>Community Name</div>
							<div>•</div>
							<div>40 min. ago</div>
						</div>
						<h2>Post Title Goes Here</h2>
						<div className="flex text-sm space-x-2">
							<div>00 Upvotes</div>
							<div>•</div>
							<div>00 Comments</div>
						</div>
					</div>);
				})
				}
			</div>
		</section>
	);
}

export default RightSection