'use client'

import Link from "next/link"
import { FaPlus } from "react-icons/fa6"
import { VscBell } from "react-icons/vsc"
import { IoSearch } from "react-icons/io5"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/component"
import { usePathname } from "next/navigation"

const Navbar = () => {
	const supabase = createClient();
	const [username, setUsername] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [unreadCount, setUnreadCount] = useState<number>(0);
	const pathname = usePathname()

	useEffect(() => {
		const loadUser = async () => {
			// get the current session
			const { data: { user } } = await supabase.auth.getUser()
			if (!user) {
				setUsername(null);
				setUserId(null)
				return
			}
			
			setUserId(user.id);

			const { data, error } = await supabase
			.from("users")
			.select("username")
			.eq("id", user.id)
			.single()

			if (error) {
				console.error("Error fetching username:", error)
			} else {
				setUsername(data?.username ?? user.email)
			}
		}

		loadUser()

		// keep it reactive on login/logout
		const { data: listener } = supabase.auth.onAuthStateChange(() => {
			loadUser()
		})

		return () => {
			listener.subscription.unsubscribe();
		}
	}, [supabase])
	
	const loadUnread = async () => {
			if (!userId){
				setUnreadCount(0);
				return;
			}
			
			const { count, error } = await supabase
			.from("notifications")
			.select("*", { count: "exact", head: true })
			.eq("user_id", userId)
			.eq("read", false);

			if (!error && typeof count === "number") {
				setUnreadCount(count);
			}
		};
		
	useEffect(() => {		
		loadUnread();
	}, [supabase, userId, pathname])

  return (
    <nav className="w-full h-14 max-w-screen fixed flex top-0 border-gray-600 border-b-1 bg-normal p-2">
      <Link href="/" className="text-xl font-bold mt-2 ml-5 min-w-60">UpYarc</Link>

      <div className="w-full flex justify-center items-center">
        <IoSearch size={20} className="relative left-8" />
        <input
          placeholder="Search"
          className="bg-white/10 hover:bg-white/20 w-full max-w-xl py-2 pr-5 pl-10 rounded-full"
        />
      </div>

	  {username ? (
        <div className="block flex space-x-2">
		  <Link href="/submit" className="flex p-2 pr-4 rounded-full hover:bg-white/20">
			<FaPlus size={22} className="mr-3" /> Create
		  </Link>

		    <Link
			  href="/notifications"
			  className="relative flex p-2 rounded-full hover:bg-white/20 space-x-2"
			  onClick={() => setUnreadCount(0)}
			>
			  <VscBell size={22} />
			  {unreadCount > 0 && (
				<span className="absolute -top-1 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
				  {unreadCount}
				</span>
			  )}
			</Link>

          <div className="block mt-2">{username}</div>
          <div className="bg-slate-400 rounded-full my-1 w-8 h-8"></div>
        </div>
      ) : (
        <Link href="/login" className="block hover:underline">
          Login
        </Link>
      )}
    </nav>
  )
}

export default Navbar
