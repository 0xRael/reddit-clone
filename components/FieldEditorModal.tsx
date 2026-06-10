'use client'

import { useEffect, useState } from 'react'

type FieldEditorModalProps = {
  open: boolean
  title: string
  label: string
  description?: string
  initialValue: string
  onClose: () => void
  onSave: (value: string) => void
}

export default function FieldEditorModal({
  open,
  title,
  label,
  description,
  initialValue,
  onClose,
  onSave,
}: FieldEditorModalProps) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (open) {
      setValue(initialValue)
    }
  }, [initialValue, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-neutral-900 p-6 text-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 transition hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        {description ? <p className="mb-6 text-sm text-gray-400">{description}</p> : null}

        <label className="block mb-6">
          <span className="mb-2 block text-sm font-medium text-white/80">{label}</span>
          <input
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
            placeholder={`Enter new ${label.toLowerCase()}`}
          />
        </label>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-neutral-800 px-4 py-2 text-sm text-white transition hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(value)
              onClose()
            }}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
