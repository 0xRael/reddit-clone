'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/component'
import { resolveMentionsToTokens } from "@/utils/mentions";
import { Community } from '@/types'

type Props = {
  open: boolean
  onClose: () => void
  community?: Community
  onSaved?: (updated: Community) => void
}

export default function CommunityCreator({ open, onClose, community, onSaved }: Props) {
  const isEditing = Boolean(community)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    setName(community?.name ?? '')
    setDescription(community?.description ?? '')
  }, [open, community])

  async function handleSubmit() {
    if (isSaving || !name.trim()) return
    setIsSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsSaving(false)
      return
    }

    const formattedText = await resolveMentionsToTokens(description)

    if (isEditing && community) {
      const { data, error } = await supabase
        .from("communities")
        .update({
          name: name.trim(),
          description: formattedText,
        })
        .eq("id", community.id)
        .eq("owner_id", user.id)
        .select('*')
        .single<Community>()

      setIsSaving(false)

      if (error) {
        console.error("Error updating community:", error)
        alert("Could not update community.")
        return
      }

      onSaved?.(data)
      onClose()
      router.refresh()
    } else {
      const { data, error } = await supabase
        .from("communities")
        .insert({
          name: name.trim(),
          description: formattedText,
          owner_id: user.id
        })
        .select('id')
        .single()

      setIsSaving(false)

      if (error) {
        console.error("An error occurred when creating the community:", error)
        return
      }

      onClose()
      router.push(`/community/${data.id}`)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-background text-white rounded-xl w-full max-w-lg p-6 shadow-lg relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-2">
          {isEditing ? "Edit community" : "Tell us about your community"}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {isEditing
            ? "Update your community name and description."
            : "A name and description help people understand what your community is all about."}
        </p>

        <label className="block mb-4">
          <span className="block text-sm font-medium">Community name *</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full p-3 rounded-xl hover:bg-white/5 border border-gray-700 hover:border-gray-500 placeholder:text-gray-400"
            placeholder="Community"
          />
        </label>

        <label className="block mb-6">
          <span className="block text-sm font-medium">Description *</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full p-3 rounded-xl min-h-30 hover:bg-white/5 border border-gray-700 hover:border-gray-500 placeholder:text-gray-400"
            placeholder="Your community description"
          />
        </label>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-neutral-700 hover:bg-neutral-600"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || !name.trim()}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : isEditing ? "Save" : "Next"}
          </button>
        </div>
      </div>
    </div>
  )
}
