"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { IoIosArrowDown } from "react-icons/io";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  communityQueryOptions,
  joinedCommunitiesQueryOptions,
  ownedCommunitiesQueryOptions,
  type Community,
} from "@/utils/queries/communities";
import {
  postQueryOptions,
  updatePost,
  insertPost,
} from "@/utils/queries/posts";
import { uploadUserFile } from "@/utils/queries/storage";

import { MarkdownEditor } from "@/components/MarkdownEditor";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB in bytes

export default function PostingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryClient = useQueryClient();
  const urlCommunityId = searchParams.get("community");

  const editId = searchParams.get("edit");
  const isEditing = Boolean(editId);

  const { data: urlCommunity } = useQuery({
    ...communityQueryOptions(urlCommunityId),
    enabled: !isEditing && Boolean(urlCommunityId),
  });

  // Form states
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [chosenCommunity, setChosenCommunity] = useState<Community | null>(null);

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditing && urlCommunity) {
      setChosenCommunity(urlCommunity);
    }
  }, [isEditing, urlCommunity]);

  // Dropdown states
  const { data: joined = [] } = useQuery(joinedCommunitiesQueryOptions());
  const { data: owned = [] } = useQuery(ownedCommunitiesQueryOptions());
  const joinedCommunities = [...joined, ...owned];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const editingPostOpts = postQueryOptions(editId);
  const { data: editingPost } = useQuery(editingPostOpts);

  useEffect(() => {
    if (!editingPost) return;
    const comm = Array.isArray(editingPost.communities)
      ? editingPost.communities[0]
      : editingPost.communities;
    setTitle(editingPost.title ?? "");
    setBody(editingPost.body ?? "");
    setChosenCommunity(comm ?? null);
    setExistingImageUrl(editingPost.image_url ?? null);
  }, [editingPost]);

  const savePostMutation = useMutation({
    mutationFn: async () => {
      let finalImageUrl = existingImageUrl;

      if (imageFile) {
        const { url, error: uploadError } = await uploadUserFile(imageFile);
        if (uploadError) throw new Error(uploadError);
        finalImageUrl = url;
      }

      const { error } =
        isEditing && editId
          ? await updatePost(
              editId,
              title,
              body,
              chosenCommunity?.id ?? null,
              finalImageUrl
            )
          : await insertPost(
              title,
              body,
              chosenCommunity?.id ?? null,
              finalImageUrl
            );

      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (editId) {
        queryClient.invalidateQueries({ queryKey: editingPostOpts.queryKey });
        router.push(`/post/${editId}`);
      } else {
        router.push("/");
      }
    },
    onError: (err) => {
      console.error("An error occurred when saving post:", err);
    },
  });

  return (
    <div className="w-full h-full pt-5 flex items-center justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!savePostMutation.isPending) savePostMutation.mutate();
        }}
        className="w-full max-w-2xl space-y-4"
      >
        <h1 className="text-2xl font-bold">
          {isEditing ? "Edit post" : "Create post"}
        </h1>

        {/* Dropdown Container */}
        <div className="relative inline-block z-10">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex p-2 rounded-full bg-white/10 hover:bg-white/20 space-x-2 items-center"
          >
            {chosenCommunity ? (
              <>
                <div className="shrink-0">
                  <div className="bg-slate-400 rounded-full w-6 h-6 overflow-hidden flex items-center justify-center">
                    {chosenCommunity.icon_url ? (
                      <img
                        src={chosenCommunity.icon_url}
                        alt={chosenCommunity.name ?? "Community icon"}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                </div>
                <span className="font-medium pr-2">
                  {chosenCommunity.name}
                </span>
              </>
            ) : (
              <span className="font-medium px-2">Choose a community</span>
            )}
            <IoIosArrowDown />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto bg-background border border-gray-700 rounded-xl shadow-xl z-20">
              {/* "No Community" Option */}
              <button
                type="button"
                onClick={() => {
                  setChosenCommunity(null);
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left p-3 hover:bg-white/10 flex items-center space-x-3 transition-colors border-b border-gray-800"
              >
                <div className="bg-slate-600 rounded-full w-8 h-8 shrink-0 flex items-center justify-center text-xs">
                  ✕
                </div>
                <span className="font-medium text-gray-300">
                  No community (Post to profile)
                </span>
              </button>

              {/* Joined Communities List */}
              {joinedCommunities.map((community, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setChosenCommunity(community);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left p-3 hover:bg-white/10 flex items-center space-x-3 transition-colors"
                >
                  <div className="shrink-0">
                    <div className="bg-slate-400 rounded-full w-8 h-8 overflow-hidden flex items-center justify-center">
                      {community.icon_url ? (
                        <img
                          src={community.icon_url}
                          alt={community.name ?? "Community icon"}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                  </div>
                  <span className="font-medium truncate">{community.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (!selectedFile) return;

            // Check if file size exceeds 3MB
            if (selectedFile.size > MAX_FILE_SIZE) {
              alert("File is too large! Please choose an image under 3MB.");
              e.target.value = ""; // Reset the input value so selecting the same file again triggers onChange
              return;
            }

            setImageFile(selectedFile);
          }}
        />

        {/* Post Options */}
        <div className="space-x-5 text-white border-b border-gray-700 flex items-center">
          <button
            type="button"
            className="p-3 border-blue-400 border-b-2 hover:bg-white/10 font-medium"
          >
            Text
          </button>

          {/* Images & Video Button - Triggers hidden file input */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 hover:bg-white/10 text-gray-400 flex items-center space-x-2"
          >
            <span>Images & Video</span>
            {(imageFile || existingImageUrl) && (
              <span className="text-xs bg-blue-600 text-white pl-2 pr-1 py-0.5 rounded-full flex items-center space-x-1 max-w-[160px]">
                <span className="truncate">
                  {imageFile ? imageFile.name : "Current image"}
                </span>
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents opening the file picker again!
                    setImageFile(null);
                    setExistingImageUrl(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""; // Clears the native input
                    }
                  }}
                  className="hover:bg-blue-700/80 rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px] font-bold text-white transition-colors cursor-pointer"
                  title="Remove image"
                >
                  ✕
                </span>
              </span>
            )}
          </button>

          <button
            type="button"
            className="p-3 hover:bg-white/10 text-gray-400"
          >
            Link
          </button>
          <button
            type="button"
            className="p-3 hover:bg-white/10 text-gray-400"
          >
            Poll
          </button>
        </div>

        <input
          placeholder="Title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="block p-3 border-gray-700 hover:border-gray-500 hover:bg-white/5 border-1 rounded-xl w-full max-w-2xl placeholder:text-gray-400"
        />

        <MarkdownEditor
          placeholder="Body Text"
          value={body}
          onChange={(value) => setBody(value)}
          minHeightClass="min-h-50"
        />

        <div className="flex">
          <div className="w-full"></div>
          <button
            type="submit"
            disabled={savePostMutation.isPending}
            className="py-3 px-5 rounded-full bg-white/10 hover:bg-white/20"
          >
            {savePostMutation.isPending
              ? "Saving..."
              : isEditing
              ? "Save"
              : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
