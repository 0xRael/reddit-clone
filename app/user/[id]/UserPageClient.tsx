"use client";

import { useQuery } from "@tanstack/react-query";
import PostsList from "@/components/PostsList";
import { userQueryOptions } from "@/utils/queries/users";
import type { User } from '@/types'

export function UserPageClient({
  id,
  initialUser,
}: {
  id: string;
  initialUser: User;
}) {
  const { data: user = initialUser } = useQuery({
    ...userQueryOptions(id),
    initialData: initialUser,
    enabled: Boolean(id),
  });

  return (
    <div className="w-full h-full justify-center">
      {user ? (
        <div className="w-full h-full justify-center flex relative">
          <div className="w-full max-w-2xl">
            {/* User Header Bar */}
            <div className="w-full flex h-10 my-3 ml-2 space-x-2">
              {/* User Icon */}
              <div className="bg-slate-400 relative rounded-full w-14 h-14 overflow-hidden shrink-0 group" />

              <h1 className="text-xl mt-3 text-gray-100 font-bold">
                {user.username}
              </h1>
            </div>
            <PostsList userId={user.id} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
