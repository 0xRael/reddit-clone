import { Suspense } from 'react'
import SearchingPage from '@/components/SearchingPage'

export default function SubmitPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <SearchingPage />
    </Suspense>
  )
}
