import { Skeleton } from '@/components/Skeleton'

export default function LoadingCommunity() {
  return <div className="w-full h-full justify-center">
    <div className="block w-full max-w-5xl mx-auto">
      <Skeleton
        className="w-full h-32 rounded-lg"
      />

      {/* Community Header Bar */}
      <div className="w-full flex sm:h-10 max-sm:h-8 my-3 ml-2 space-x-2">
        {/* Community Icon */}
        <Skeleton
          className="relative sm:-top-10 max-sm:-top-7 rounded-full sm:w-20 sm:h-20 max-sm:w-15 max-sm:h-15"
        />

        <Skeleton className="h-5 w-full" />

        <Skeleton className="max-sm:hidden rounded-full h-full sm:w-10 max-sm:w-8 p-2"/>
        <Skeleton className="rounded-full h-full sm:w-10 max-sm:w-8 p-2"/>
      </div>
    </div>
  </div>
}
