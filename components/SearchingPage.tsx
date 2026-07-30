'use client'

import Link from "next/link";
import { useSearchParams } from 'next/navigation'
import PostsList from '@/components/PostsList'
import { createClient } from "@/utils/supabase/component"
import { useEffect, useState } from "react"

import { Community } from '@/types'

export default function SearchingPage() {
	const searchParams = useSearchParams()
    const supabase = createClient()
    const [communities, setCommunities] = useState<Community[]>([])

    useEffect(() => {
        const load = async () => {			
			const { data } = await supabase
			.from('communities')
			.select(`
				*
			`)
			.order("created_at", { ascending: false })
            .or(`name.ilike.%${searchParams.get('q')}%,description.ilike.%${searchParams.get('q')}%`);
			
			setCommunities(data ?? []);
		}
		
		load();
    }, [supabase, searchParams]);

    return (
        <div className="w-full h-full justify-center">
            <div className="w-full h-full justify-center flex relative">
				<PostsList searchQuery={searchParams.get('q')}/>
                <section className="lg:sticky max-lg:hidden top-14 w-74 h-[calc(100vh-3.5rem)] overflow-y-hidden hover:overflow-y-scroll overflow-x-hidden overscroll-contain py-5 ml-5">
                    <div className="bg-black text-gray-400 rounded-xl w-full p-5 space-y-2">
                        <h6 className="text-[10px] font-bold text-gray-500 uppercase">Communities</h6>

                        {communities.map((community) => (
                            <Link 
                                key={community.id} 
                                href={`/community/${community.id}`}
                                className="block flex px-4 py-3 hover:bg-white/5 transition border-b border-gray-900 last:border-0"
                            >
                                <div className="mr-2 shrink-0">
                                    <div className="bg-slate-400 rounded-full w-8 h-8 overflow-hidden flex items-center justify-center">
                                        {community.icon_url ? (
                                            <img 
                                                src={community.icon_url} 
                                                alt={community.name ?? "Community icon"} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : null}
                                    </div>
                                </div>
                                
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-100 line-clamp-2 leading-tight">
                                        {community.name}
                                    </h2>
                                    
                                    <span className="flex text-[11px] text-gray-400 mt-1">
                                        {community.description}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
			</div>
        </div> 
    )
}