"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaPlus } from "react-icons/fa6";
import { LuPencil } from "react-icons/lu";

import PostsList from "@/components/PostsList";
import CommunityInfo from "@/components/CommunityInfo";
import { useModal } from "@/components/ModalProvider";
import {
  communityQueryOptions,
  communityOwnerCheckQueryOptions,
  hasJoinedCommunityQueryOptions,
  joinedCommunitiesQueryOptions,
  leaveCommunity,
  joinCommunity,
  type Community,
} from "@/utils/queries/communities";
import { uploadCommunityFile } from "@/utils/queries/storage";

export default function CommunityPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const queryClient = useQueryClient();
  const { openCommunityCreator } = useModal();

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const communityOpts = communityQueryOptions(id);
  const { data: community } = useQuery(communityOpts);

  const { data: isOwner = false } = useQuery(
    communityOwnerCheckQueryOptions(community)
  );

  const joinedOpts = hasJoinedCommunityQueryOptions(community?.id);
  const { data: hasJoined = false } = useQuery(joinedOpts);

  const uploadMediaMutation = useMutation({
    mutationFn: async ({
      file,
      type,
    }: {
      file: File;
      type: "banner" | "icon";
    }) => {
      if (!community) throw new Error("Community not loaded");
      const { url: publicUrl, error: uploadError } = await uploadCommunityFile(
        file,
        community.id,
        type
      );
      if (uploadError) throw new Error(uploadError);
      return { type, publicUrl };
    },
    onMutate: ({ type }) => {
      if (type === "banner") setUploadingBanner(true);
      else setUploadingIcon(true);
    },
    onSuccess: ({ type, publicUrl }) => {
      queryClient.setQueryData<Community | null>(communityOpts.queryKey, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...(type === "banner"
            ? { banner_url: publicUrl }
            : { icon_url: publicUrl }),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err, { type }) => {
      console.error(`Error uploading ${type}:`, err);
      alert(`Failed to upload ${type}`);
    },
    onSettled: (_data, _err, { type }) => {
      if (type === "banner") setUploadingBanner(false);
      else setUploadingIcon(false);
    },
  });

  const toggleJoinMutation = useMutation({
    mutationFn: async () => {
      const { error } = hasJoined
        ? await leaveCommunity(id)
        : await joinCommunity(id);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: joinedOpts.queryKey });
      queryClient.invalidateQueries({
        queryKey: joinedCommunitiesQueryOptions().queryKey,
      });
    },
    onError: (error) => {
      console.error("Error updating membership:", error);
    },
  });

  const handleImageUpload = (file: File, type: "banner" | "icon") => {
    if (!community || uploadMediaMutation.isPending) return;
    uploadMediaMutation.mutate({ file, type });
  };

  const join = () => {
    if (toggleJoinMutation.isPending) return;
    toggleJoinMutation.mutate();
  };

  return (
    <div className="w-full h-full justify-center">
      {community ? (
        <>
          {/* Hidden File Inputs for Banner and Icon */}
          {isOwner && (
            <>
              <input
                type="file"
                ref={bannerInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleImageUpload(e.target.files[0], "banner")
                }
              />
              <input
                type="file"
                ref={iconInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleImageUpload(e.target.files[0], "icon")
                }
              />
            </>
          )}

          <div className="block w-full max-w-5xl mx-auto">
            {/* Community Banner */}
            <div
              onClick={() => isOwner && bannerInputRef.current?.click()}
              className={`w-full h-32 bg-slate-600 rounded-lg relative overflow-hidden group ${
                isOwner ? "cursor-pointer" : ""
              }`}
            >
              {community.banner_url && (
                <img
                  src={community.banner_url}
                  alt="Community Banner"
                  className="w-full h-full object-cover"
                />
              )}
              {/* Owner Hover Overlay for Banner */}
              {isOwner && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white space-x-2">
                  <LuPencil size={18} />
                  <span className="text-sm font-semibold">
                    {uploadingBanner ? "Uploading..." : "Change Banner"}
                  </span>
                </div>
              )}
            </div>

            {/* Community Header Bar */}
            <div className="w-full flex sm:h-10 max-sm:h-8 my-3 ml-2 space-x-2">
              {/* Community Icon */}
              <div
                onClick={() => isOwner && iconInputRef.current?.click()}
                className={`bg-slate-400 relative sm:-top-10 max-sm:-top-7 rounded-full border-neutral-900 border-4 sm:w-20 sm:h-20 max-sm:w-15 max-sm:h-15 overflow-hidden shrink-0 group ${
                  isOwner ? "cursor-pointer" : ""
                }`}
              >
                {community.icon_url ? (
                  <img
                    src={community.icon_url}
                    alt="Community Icon"
                    className="w-full h-full object-cover"
                  />
                ) : null}
                {/* Owner Hover Overlay for Icon */}
                {isOwner && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <LuPencil size={16} />
                  </div>
                )}
              </div>

              <h1 className="sm:text-xl mr-auto text-gray-100 font-bold truncate">
                {community.name}
              </h1>

              <Link
                href={`/submit?community=${community.id}`}
                className="max-sm:hidden flex rounded-full p-2 sm:pr-3 border-gray-700 hover:bg-white/5 hover:border-gray-500 border-1 sm:space-x-2"
              >
                <FaPlus size={22} />
                <div className="max-sm:hidden">Create Post</div>
              </Link>
              {!isOwner && (
                <button
                  onClick={join}
                  className="max-sm:text-xs rounded-full p-2 sm:px-4 bg-blue-800 hover:bg-blue-600 cursor-pointer"
                >
                  {hasJoined ? "Leave" : "Join"}
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() =>
                    openCommunityCreator(community, (updated) => {
                      queryClient.setQueryData(communityOpts.queryKey, updated);
                      queryClient.invalidateQueries({ queryKey: ["communities"] });
                    })
                  }
                  className="rounded-full p-2 border-gray-700 hover:bg-white/5 hover:border-gray-500 border-1 space-x-2 cursor-pointer"
                >
                  <LuPencil size={22} />
                </button>
              )}
            </div>
          </div>

          <div className="w-full h-full justify-center flex relative">
            <PostsList communityId={community.id} />
            <CommunityInfo communityId={community.id} />
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
