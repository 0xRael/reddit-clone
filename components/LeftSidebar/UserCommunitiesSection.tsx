"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ownedCommunitiesQueryOptions,
  joinedCommunitiesQueryOptions,
} from "@/utils/queries/communities";

type SidebarCommunity = {
  id: string | null;
  name: string | null;
  icon_url: string | null;
};

type UserCommunitiesSectionProps = {
  ownedFallback?: ReactNode;
  joinedFallback?: ReactNode;
};

function CommunityLink({ community }: { community: SidebarCommunity }) {
  return (
    <Link
      className="flex items-center relative rounded-md p-2 hover:bg-white/10"
      href={`/community/${community.id}`}
    >
      <div className="ml-2 mr-4 shrink-0">
        <div className="bg-slate-400 rounded-full w-7 h-7 overflow-hidden flex items-center justify-center">
          {community.icon_url ? (
            <img
              src={community.icon_url}
              alt={community.name ?? "Community icon"}
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
      </div>
      <div className="truncate">{community.name ?? ""}</div>
    </Link>
  );
}

export function UserCommunitiesSection({
  ownedFallback = null,
  joinedFallback = null,
}: UserCommunitiesSectionProps) {
  const { data: joins = [], isPending: joinsPending } = useQuery(
    joinedCommunitiesQueryOptions()
  );
  const { data: ownedCommunities = [], isPending: ownedPending } = useQuery(
    ownedCommunitiesQueryOptions()
  );

  return (
    <>
      {ownedPending ? (
        ownedFallback && (
          <>
            <hr className="my-5 border-gray-700" />
            <h6 className="text-sm text-gray-500 mb-3 mx-2">MODERATION</h6>
            {ownedFallback}
          </>
        )
      ) : (
        ownedCommunities.length > 0 && (
          <>
            <hr className="my-5 border-gray-700" />
            <h6 className="text-sm text-gray-500 mb-3 mx-2">MODERATION</h6>
            {ownedCommunities.map((community) => (
              <CommunityLink key={community.id} community={community} />
            ))}
          </>
        )
      )}

      {joinsPending ? (
        joinedFallback && (
          <>
            <hr className="my-5 border-gray-700" />
            <h6 className="text-sm text-gray-500 mb-3 mx-2">
              JOINED COMMUNITIES
            </h6>
            {joinedFallback}
          </>
        )
      ) : (
        joins.length > 0 && (
          <>
            <hr className="my-5 border-gray-700" />
            <h6 className="text-sm text-gray-500 mb-3 mx-2">
              JOINED COMMUNITIES
            </h6>
            {joins.map((community) => (
              <CommunityLink key={community.id} community={community} />
            ))}
          </>
        )
      )}
    </>
  );
}
