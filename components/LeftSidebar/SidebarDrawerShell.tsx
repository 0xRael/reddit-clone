"use client";

import { useState, type ReactNode } from "react";
import { FaTimes, FaBars } from "react-icons/fa";

export function SidebarDrawerShell({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle navigation sidebar"
        className="fixed top-2 left-2 z-50 p-2 text-white rounded-md xl:hidden"
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      <section
        className={`xl:sticky transition-transform duration-400 max-xl:fixed bg-background max-lg:-ml-4 max-lg:pl-4 max-xl:z-2 ${
          isOpen ? "" : "max-xl:-translate-x-80"
        } top-14 w-80 h-[calc(100vh-3.5rem)] overflow-y-hidden hover:overflow-y-scroll overflow-x-hidden overscroll-contain border-r-1 border-gray-600 p-5`}
      >
        {children}
      </section>
    </>
  );
}
