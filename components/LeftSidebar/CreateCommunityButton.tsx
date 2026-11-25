"use client";

import { FaPlus } from "react-icons/fa6";
import { useModal } from "@/components/ModalProvider";

export function CreateCommunityButton() {
  const { openCommunityCreator } = useModal();

  return (
    <button
      type="button"
      onClick={() => openCommunityCreator()}
      className="w-full flex relative rounded-md p-2 cursor-pointer hover:bg-white/10"
    >
      <div className="ml-2 mr-4">
        <FaPlus size={22} />
      </div>
      <div>Create Community</div>
    </button>
  );
}
