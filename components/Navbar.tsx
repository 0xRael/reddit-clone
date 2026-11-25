"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
// Icons
import { FaPlus } from "react-icons/fa6";
import { VscBell } from "react-icons/vsc";
import { IoSearch } from "react-icons/io5";
import { VscSignOut } from "react-icons/vsc";
import { IoSettingsOutline } from "react-icons/io5";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userQueryOptions } from "@/utils/queries/users";
import { unreadNotificationsCountQueryOptions } from "@/utils/queries/notifications";
import { signOutUser, subscribeToAuthStateChange } from "@/utils/queries/auth";

const Navbar = () => {
  const queryClient = useQueryClient();

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const currentUserOpts = userQueryOptions();
  const { data: user = null } = useQuery(currentUserOpts);

  const unreadOpts = unreadNotificationsCountQueryOptions(user?.id);
  const { data: unreadCount = 0 } = useQuery({
    ...unreadOpts,
    enabled: Boolean(user?.id),
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return subscribeToAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: currentUserOpts.queryKey });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
  }, [queryClient, currentUserOpts.queryKey]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    queryClient.setQueryData(currentUserOpts.queryKey, null);
    queryClient.setQueryData(unreadOpts.queryKey, 0);
    setMenuOpen(false);
  };

  return (
    <nav className="w-full h-14 max-w-screen fixed flex top-0 border-gray-600 border-b-1 bg-background/60 backdrop-blur-sm p-2">
      <Link
        href="/"
        className="text-xl font-bold ml-5 lg:min-w-60 max-lg:min-w-10 max-xl:ml-10"
      >
        <Image
          src="/title.png"
          width={160}
          height={30}
          alt="UpYarc"
          className="-mt-2 max-lg:hidden"
        />
        <Image
          src="/icon.png"
          width={50}
          height={50}
          alt="UpYarc"
          className="lg:hidden"
        />
      </Link>

      <form
        onSubmit={handleSearch}
        className="w-full flex justify-center items-center"
      >
        <IoSearch
          size={20}
          className="relative left-8 pointer-events-none text-gray-400"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          className="bg-white/10 hover:bg-white/20 w-full max-w-xl py-2 pr-5 pl-10 rounded-full"
        />
      </form>

      {user?.username ? (
        <div className="block flex">
          <Link
            href="/submit"
            className="flex p-2 rounded-full hover:bg-white/20"
          >
            <FaPlus size={22} />{" "}
            <span className="ml-3 max-sm:hidden">Create</span>
          </Link>

          <Link
            href="/notifications"
            className="relative flex p-2 rounded-full hover:bg-white/20 space-x-2"
          >
            <VscBell size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>

          <div ref={menuRef} className="relative block">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex block px-1 rounded-full hover:bg-white/20 cursor-pointer"
            >
              <span className="mt-2 mx-2 max-sm:hidden">
                {user?.username ?? ""}
              </span>
              <div className="bg-slate-400 rounded-full my-1 w-8 h-8"></div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-background shadow-xl">
                <Link
                  href={`/user/${user?.id ?? ""}`}
                  className="flex px-4 py-2 text-sm text-white hover:bg-white/10 items-center"
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="ml-1 mr-2">
                    <div className="bg-slate-400 rounded-full my-1 w-5 h-5"></div>
                  </div>
                  <div>View Profile</div>
                </Link>
                <Link
                  href="/settings"
                  className="flex px-4 py-2 text-sm text-white hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="ml-1 mr-2">
                    <IoSettingsOutline size={20} />
                  </div>
                  <div>Settings</div>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 cursor-pointer"
                >
                  <div className="ml-1 mr-2">
                    <VscSignOut size={20} />
                  </div>
                  <div>Logout</div>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Link href="/login" className="block hover:underline">
          Login
        </Link>
      )}
    </nav>
  );
};

export default Navbar;
