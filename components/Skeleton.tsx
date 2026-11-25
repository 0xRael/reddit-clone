export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-white/20 ${className}`}
    />
  );
}

export function SidebarCommunityListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="px-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex items-center space-x-4 p-2">
          <Skeleton className="w-7 h-7 rounded-full shrink-0" />
          <Skeleton className="h-4 w-36 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function NavbarAuthSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-center space-x-3 shrink-0">
      <Skeleton className="h-8 w-20 rounded-full hidden sm:block" />
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-20 hidden sm:block rounded-md" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div aria-hidden="true" className="border-t-1 border-gray-700 p-3 space-y-3">
      <div className="flex items-center space-x-2">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <Skeleton className="h-3.5 w-28 rounded-md" />
        <Skeleton className="h-3.5 w-16 rounded-md" />
      </div>
      <Skeleton className="h-5 w-3/4 rounded-md" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="flex space-x-2 pt-1">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function PostsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <PostCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function RecentPostsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="divide-y divide-gray-900">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="px-4 py-3 space-y-2">
          <div className="flex items-center space-x-2 mb-2">
            <Skeleton className="w-5 h-5 rounded-full shrink-0" />
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="h-3 w-14 rounded-md" />
          </div>
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-3.5 w-4/5 rounded-md" />
        </div>
      ))}
    </div>
  );
}
