'use client'
import { useSearchParams } from 'next/navigation'
import PostsList from '@/components/PostsList'

export default function SearchingPage() {
	const searchParams = useSearchParams()

    return (
        <div className="w-full h-full justify-center">
            <div className="w-full h-full justify-center flex relative">
				<PostsList searchQuery={searchParams.get('q')}/>
			</div>
        </div> 
    )
}