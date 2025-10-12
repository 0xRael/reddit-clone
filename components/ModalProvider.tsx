'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import CommunityCreator from './CommunityCreator'

type ModalContextType = {
  openCommunityCreator: () => void
  closeCommunityCreator: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isCommunityCreatorOpen, setIsCommunityCreatorOpen] = useState(false)

  const openCommunityCreator = () => setIsCommunityCreatorOpen(true)
  const closeCommunityCreator = () => setIsCommunityCreatorOpen(false)

  return (
    <ModalContext.Provider value={{ openCommunityCreator, closeCommunityCreator }}>
      {children}

      {/* Render the modal globally */}
      <CommunityCreator open={isCommunityCreatorOpen} onClose={closeCommunityCreator} />
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}
