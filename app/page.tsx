import PostsList from "@/components/PostsList";
import RightSection from "@/components/RightSection";

const Home = ()=>{
	
	return (
		<div className="w-full h-full justify-center flex relative">
			<PostsList/>
				
			<RightSection/>
		</div>
	);
}

export default Home
