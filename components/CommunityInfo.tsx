"use client";

import Link from "next/link";
import { LuCakeSlice } from "react-icons/lu";
import { format } from "date-fns";

import { useQuery } from "@tanstack/react-query";
import { communityAndOwnerQueryOptions } from "@/utils/queries/communities";
import { MarkdownContent } from "@/components/MarkdownContent";

type Props = {
  communityId: string;
};

const UserLink = ({
  user,
}: {
  user: { id: string | null; username: string | null };
}) => {
  return (
    <Link
      className="flex items-center relative rounded-md p-2 hover:bg-white/10"
      href={`/user/${user.id}`}
    >
      <div className="ml-2 mr-4 shrink-0">
        <div className="bg-slate-400 rounded-full w-7 h-7 overflow-hidden flex items-center justify-center"></div>
      </div>
      <div className="truncate">{user.username ?? "Unnamed User"}</div>
    </Link>
  );
};

const CommunityInfo = ({ communityId }: Props) => {
  const { data: community } = useQuery(communityAndOwnerQueryOptions(communityId));

  return (
    <>
        <section className="md:sticky max-md:hidden top-14 w-74 h-[calc(100vh-3.5rem)] overflow-y-hidden hover:overflow-y-scroll overflow-x-hidden overscroll-contain py-5 ml-5">
          <div className="bg-black text-gray-400 rounded-xl w-full p-5">
            {community && (<div className="space-y-2">
            <Link
              href={`/community/${communityId}`}
              className="text-md text-gray-400 font-bold mb-3 hover:underline"
            >
              {community.name}
            </Link>

            <MarkdownContent className="w-full" content={community.description} />

            <hr className="my-5 border-gray-700" />
            <div className="flex space-x-2">
              <LuCakeSlice />
              <div>
                Created {format(new Date(community.created_at), "MMM d, yyyy")}
              </div>
            </div>
            <hr className="my-5 border-gray-700" />
            <h6 className="text-sm text-gray-500 mb-3 mx-2">OWNER</h6>
            {community.owner && <UserLink user={community.owner} />}
            </div>)}
          </div>
        </section>
    </>
  );
};

export default CommunityInfo;
