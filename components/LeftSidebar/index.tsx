import Link from "next/link";
import { IoHomeOutline } from "react-icons/io5";
import { LuCircleArrowOutUpRight } from "react-icons/lu";
import { BsPeople } from "react-icons/bs";
import { PiChartBarFill } from "react-icons/pi";

import { SidebarDrawerShell } from "./SidebarDrawerShell";
import { CreateCommunityButton } from "./CreateCommunityButton";
import { UserCommunitiesSection } from "./UserCommunitiesSection";
import { SidebarCommunityListSkeleton } from "@/components/Skeleton";

const SIDEBAR_ITEMS = [
  {
    title: "Home",
    link: "/",
    icon: IoHomeOutline,
  },
  {
    title: "Popular",
    link: "/",
    icon: LuCircleArrowOutUpRight,
  },
  {
    title: "Explore",
    link: "/explore",
    icon: BsPeople,
  },
  {
    title: "All",
    link: "/",
    icon: PiChartBarFill,
  },
];

export default function LeftSidebar() {
  return (
    <SidebarDrawerShell>
      {SIDEBAR_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            className="flex relative rounded-md p-2 hover:bg-white/10"
            href={item.link.toLowerCase()}
            key={item.title}
          >
            <div className="ml-2 mr-4">
              <Icon size={22} />
            </div>
            <div>{item.title}</div>
          </Link>
        );
      })}

      <CreateCommunityButton />
      <UserCommunitiesSection
        ownedFallback={<SidebarCommunityListSkeleton count={2} />}
        joinedFallback={<SidebarCommunityListSkeleton count={3} />}
      />
    </SidebarDrawerShell>
  );
}
