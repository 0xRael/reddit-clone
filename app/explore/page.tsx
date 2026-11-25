"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Community } from "@/types";
import { MarkdownExcerpt } from "@/components/MarkdownExcerpt";
import { getAllCommunities } from "@/utils/queries/communities";

export default function Explore() {
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    getAllCommunities().then(({ data }) => {
      setCommunities(data);
    });
  }, []);

  return (
    <div className="w-full h-full py-5 justify-center items-center flex flex-col relative">
      <h1 className="text-2xl font-bold">Explore Communities</h1>
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {communities.map((community) => (
          <Link
            key={community.id}
            href={`/community/${community.id}`}
            className="border-1 m-2 p-3 border-gray-700 rounded-xl hover:bg-white/5 hover:border-gray-500"
          >
            <div className="flex mb-2 space-x-2">
              <div className="bg-slate-400 relative rounded-full w-10 h-10 overflow-hidden shrink-0 group">
                {community.icon_url && (
                  <img src={community.icon_url} className="w-full" />
                )}
              </div>
              <div className="w-full">
                <h2 className="text-white font-bold">
                  {community.name ?? "Unnamed Community"}
                </h2>
                <p className="text-xs text-slate-400">
                  Created{" "}
                  {formatDistanceToNow(new Date(community.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            <div className="line-clamp-3">
              <MarkdownExcerpt
                className="text-sm"
                content={community.description ?? "No Description."}
                hideMediaAndCodeBlocks={false}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
