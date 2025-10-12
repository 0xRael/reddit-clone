'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/component'

type Props = {
  open: boolean
  onClose: () => void
}

export default function CommunityCreator({ open, onClose }: Props) {
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const supabase = createClient()
	const router = useRouter()

	async function createCommunity() {
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return
		}
		
		const { data, error } = await supabase
			.from("communities")
			.insert({
				name: name,
				description: description,
				owner_id: user.id
			})
			.select('id') 
			.single()
			
		if (error) {
			console.error("An error ocurred when creating the community:", error);
		} else {
			router.push(`/community/${data.id}`);
		}
	}
	
	if (!open) return null
	
	return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
	  <div className="bg-neutral-900 text-white rounded-xl w-full max-w-lg p-6 shadow-lg relative">
		{/* Close button */}
		<button
		  onClick={onClose}
		  className="absolute top-3 right-3 text-gray-400 hover:text-white"
		>
		  ✕
		</button>

		<h2 className="text-xl font-bold mb-2">Tell us about your community</h2>
		<p className="text-sm text-gray-400 mb-6">
		  A name and description help people understand what your community is all about.
		</p>

		<label className="block mb-4">
		  <span className="block text-sm font-medium">Community name *</span>
		  <input
			type="text"
			value={name}
			onChange={(e) => setName(e.target.value)}
			className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 p-2"
			placeholder="Community"
		  />
		</label>

		<label className="block mb-6">
		  <span className="block text-sm font-medium">Description *</span>
		  <textarea
			value={description}
			onChange={(e) => setDescription(e.target.value)}
			className="mt-1 w-full rounded bg-neutral-800 border border-neutral-700 p-2"
			placeholder="Your community description"
		  />
		</label>

		<div className="flex justify-end space-x-3">
		  <button
			onClick={onClose}
			className="px-4 py-2 rounded-full bg-neutral-700 hover:bg-neutral-600"
		  >
			Cancel
		  </button>
		  <button
			onClick={() => {
			  // handle creation logic here
			  createCommunity()
			  onClose()
			}}
			className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700"
		  >
			Next
		  </button>
		</div>
	  </div>
	</div>
	)
}
