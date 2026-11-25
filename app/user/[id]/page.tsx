"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import PostsList from "@/components/PostsList";
import { userQueryOptions } from "@/utils/queries/users";

export default function UserPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { data: user } = useQuery({
    ...userQueryOptions(id),
    enabled: Boolean(id),
  });

  return (
    <div className="w-full h-full justify-center">
      {user ? (
        <>
          <div className="w-full h-full justify-center flex relative">
            <div>
              {/* User Header Bar */}
              <div className="w-full flex h-10 my-3 ml-2 space-x-2">
                {/* User Icon */}
                <div className="bg-slate-400 relative rounded-full w-14 h-14 overflow-hidden shrink-0 group"></div>

                <h1 className="text-xl mt-3 text-gray-100 font-bold">
                  {user.username}
                </h1>
              </div>
              <PostsList userId={user.id} />
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
