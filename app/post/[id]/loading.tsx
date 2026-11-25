import { Skeleton } from '@/components/Skeleton'

export default function LoadingPost() {
  return <div className="w-full h-full justify-center flex relative">
          <div className="w-full max-w-3xl">
            <div className="space-y-2 py-3">
              <div className="flex text-sm items-center space-x-2">
                <Skeleton className="rounded-full w-8 h-8" />
                
                <Skeleton className="rounded-md w-20 h-3" />
                <Skeleton className="rounded-md w-30 h-3" />

              </div>

              <Skeleton className="rounded-md w-full h-5" />

              <Skeleton className="rounded-md w-full h-60 my-5" />

              <Skeleton className="rounded-md w-full h-5" />
              <Skeleton className="rounded-md w-full h-5" />
              <Skeleton className="rounded-md w-full h-5" />
              <Skeleton className="rounded-md w-full h-5" />
              <Skeleton className="rounded-md w-full h-5" />

              <div className="flex space-x-2">
                  <Skeleton className="rounded-full w-10 h-5" />
                  <Skeleton className="rounded-full w-10 h-5" />
                  <Skeleton className="rounded-full w-10 h-5" />
              </div>
            </div>
          </div>
        <Skeleton className="top-14 w-74 h-fit ml-5" />
    </div>
}
