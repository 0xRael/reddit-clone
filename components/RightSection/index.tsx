import RightSectionClient from "./RightSectionClient";
import { RecentPostsSkeleton } from "@/components/Skeleton";

export default function RightSection() {
  return <RightSectionClient fallback={<RecentPostsSkeleton count={5} />} />;
}
