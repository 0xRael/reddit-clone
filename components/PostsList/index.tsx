import { PostsListClient } from "./PostsListClient";
import { PostsListSkeleton } from "@/components/Skeleton";

type Props = {
  communityId?: string | null;
  userId?: string | null;
  searchQuery?: string | null;
};

export default function PostsList({
  communityId,
  userId,
  searchQuery,
}: Props) {
  return (
    <PostsListClient
      communityId={communityId}
      userId={userId}
      searchQuery={searchQuery}
      fallback={<PostsListSkeleton count={4} />}
    />
  );
}
