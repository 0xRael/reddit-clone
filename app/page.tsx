import type { Metadata } from "next";
import PostsList from "@/components/PostsList";
import RightSection from "@/components/RightSection";

export const metadata: Metadata = {
  title: "UpYarc — Home",
  description: "We're Up Yet Another Reddit Clone. Browse the latest community posts and discussions.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "UpYarc",
    description: "We're Up Yet Another Reddit Clone.",
    url: "/",
  },
};

const Home = () => {
  return (
    <div className="w-full h-full justify-center flex relative">
      <PostsList />
      <RightSection />
    </div>
  );
};

export default Home;
