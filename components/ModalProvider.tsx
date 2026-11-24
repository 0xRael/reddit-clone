'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import CommunityCreator from './CommunityCreator'
import { Community } from '@/types'

type ModalContextType = {
  openCommunityCreator: (community?: Community, onSaved?: (updated: Community) => void) => void
  closeCommunityCreator: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isCommunityCreatorOpen, setIsCommunityCreatorOpen] = useState(false)
  const [editingCommunity, setEditingCommunity] = useState<Community | undefined>(undefined)
  const [onSavedCallback, setOnSavedCallback] = useState<((updated: Community) => void) | undefined>(undefined)

  const openCommunityCreator = (
    community?: Community,
    onSaved?: (updated: Community) => void
  ) => {
    setEditingCommunity(community)
    setOnSavedCallback(() => onSaved)
    setIsCommunityCreatorOpen(true)
  }

  const closeCommunityCreator = () => {
    setIsCommunityCreatorOpen(false)
    setEditingCommunity(undefined)
    setOnSavedCallback(undefined)
  }

  return (
    <ModalContext.Provider value={{ openCommunityCreator, closeCommunityCreator }}>
      {children}

      <CommunityCreator
        open={isCommunityCreatorOpen}
        onClose={closeCommunityCreator}
        community={editingCommunity}
        onSaved={onSavedCallback}
      />
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}
