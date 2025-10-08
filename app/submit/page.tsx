'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/component'

export default function PostingPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  
  async function post() {
    const { data: { user } } = await supabase.auth.getUser()
	if (!user) {
		return
	}
	
	const { data, error } = await supabase
        .from("posts")
        .insert({
			title: title,
			body: body,
			user_id: user.id
		})
		
	if (error) {
		console.error("An error ocurred when posting:", error);
	} else {
		router.push("/");
	}
  }
  
  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault()
		  post()
        }}
		className="space-y-4"
      >
		<h1 className="text-2xl font-bold">Create post</h1>
		
		{/* This is supposed to be a Dropbox */}
		<button className="flex p-2 rounded-full bg-white/10 hover:bg-white/20 space-x-2">
			<div className="bg-slate-400 rounded-full w-6 h-6"></div>
			<div>Select a community</div>
		</button>
		
		{/* Post Options */}
		<div className="mt-7 space-x-5 text-white">
			<button className="p-3 border-blue-400 border-b-4 hover:bg-white/10">Text</button>
			<button className="p-3 hover:bg-white/10">Images & Video</button>
			<button className="p-3 hover:bg-white/10">Link</button>
			<button className="p-3 hover:bg-white/10">Poll</button>
		</div>
		
		<input
			placeholder="Title"
			type="text"
			onChange={(e) => setTitle(e.target.value)}
			className="block p-3 border-gray-700 hover:border-gray-500 hover:bg-white/5 border-1 rounded-xl w-2xl placeholder:text-gray-400"
			/>
		
		<input
			placeholder="Body Text"
			type="text"
			onChange={(e) => setBody(e.target.value)}
			className="block p-3 border-gray-700 hover:border-gray-500 hover:bg-white/5 border-1 rounded-xl w-2xl placeholder:text-gray-400"
			/>
		
		<div className="flex">
			<div className="w-full"></div>
			<button type="submit" className="py-3 px-5 rounded-full bg-white/10 hover:bg-white/20">Post</button>
		</div>
      </form>
    </div>
  )
}