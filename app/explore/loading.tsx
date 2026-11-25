import { Skeleton } from "@/components/Skeleton";

export default function ExploreLoading() {
  return (
    <div
      aria-hidden="true"
      className="w-full h-full py-5 justify-center items-center flex flex-col relative"
    >
      <h1 className="text-2xl font-bold">Explore Communities</h1>
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, idx) => (
          <div
            key={idx}
            className="border-1 m-2 p-3 border-gray-700 rounded-xl"
          >
            <div className="flex mb-2 space-x-2">
              <Skeleton className="rounded-full w-10 h-10 shrink-0" />
              <div className="w-full space-y-1.5 pt-0.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-11/12" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
