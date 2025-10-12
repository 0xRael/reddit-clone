import { Suspense } from 'react'
import PostingPage from '@components/PostingPage'

export default function SubmitPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <PostingPage />
    </Suspense>
  )
}
