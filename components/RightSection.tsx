"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/component";
import { useRecentPosts } from "@/hooks/useRecentPosts";
import { formatDistanceToNow } from 'date-fns';
import Link from "next/link";

import { Post } from "@/types"

const RightSection = () => {
    const { postIds, clearPosts } = useRecentPosts();
    const [posts, setPosts] = useState<Post[]>([]);
    const supabase = createClient();

    useEffect(() => {
        const fetchRecentData = async () => {
            if (postIds.length === 0) {
                setPosts([]);
                return;
            }

            const { data, error } = await supabase
                .from("posts")
                .select(`
                    *,
                    users (
                        username
                    ),
                    communities (
                        name,
                        icon_url
                    ),
                    post_votes_view (
                        upvotes,
                        downvotes
                    ),
                    post_replies_view (
                        count
                    )
                `)
                .in("id", postIds);

            if (data) {
                // Supabase doesn't guarantee order based on the .in() array, 
                // so we manually sort them to match the postIds order (most recent first)
                const sortedData = postIds
                    .map(id => data.find(p => p.id === id))
                    .filter(Boolean) as Post[];
                
                setPosts(sortedData);
            }
        };

        fetchRecentData();
    }, [postIds, supabase]);

    if (postIds.length === 0) return null;

    return (
        <section className="lg:sticky max-lg:hidden top-14 w-74 h-fit py-5 ml-5">
            <div className="bg-black rounded-xl w-full py-4">
                <div className="flex justify-between items-center mb-3 px-4">
                    <h6 className="text-[10px] font-bold text-gray-500 uppercase">Recent Posts</h6>
                    <button onClick={clearPosts} className="text-xs text-blue-500 hover:text-blue-400">Clear</button>
                </div>

                {posts.map((post) => (
                    <Link 
                        key={post.id} 
                        href={`/post/${post.id}`}
                        className="block px-4 py-3 hover:bg-white/5 transition border-b border-gray-900 last:border-0"
                    >
                        <div className="flex items-center text-[11px] text-gray-400 space-x-1 mb-2">
                            <div className="shrink-0 mr-1">
                                <div className="bg-slate-400 rounded-full w-5 h-5 overflow-hidden flex items-center justify-center">
                                    {post.communities?.icon_url ? (
                                        <img 
                                            src={post.communities?.icon_url} 
                                            alt={post.communities?.name ?? "Community icon"} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : null}
                                </div>
                            </div>
                            <span className="font-bold text-gray-300">{post.communities?.name || 'unknown'}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                        </div>
                        <h2 className="text-sm font-semibold text-gray-100 line-clamp-2 leading-tight">
                            {post.title}
                        </h2>
                        <div className="flex text-[11px] text-gray-400 mt-1">
                            <span>
                                {(post.post_votes_view?.[0]?.upvotes || 0) - (post.post_votes_view?.[0]?.downvotes || 0)} upvotes
                            </span>
                            <span className="mx-1">•</span>
                            <span>{post.post_replies_view?.[0]?.count || 0} comments</span>
                        </div>
                    </Link>
                ))}
            </div>
			<div className="text-gray-400 p-5 text-sm">
				<a target="_blank" href="https://github.com/0xRael/reddit-clone"
					className="hover:text-gray-100 hover:underline">Github Page</a>
			</div>
        </section>
    );
};

export default RightSection;