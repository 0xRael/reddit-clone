"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FieldEditorModal from "@/components/FieldEditorModal";
import ConfirmModal from "@/components/ConfirmModal";
import { IoIosArrowForward } from "react-icons/io";
import { getUser, updateUsername } from "@/utils/queries/users";
import {
  getSessionUser,
  updateAuthEmail,
  deleteCurrentAccount,
} from "@/utils/queries/auth";

type SettingsField = "username" | "email" | null;

export default function SettingsPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeField, setActiveField] = useState<SettingsField>(null);

  useEffect(() => {
    const loadUser = async () => {
      const sessionUser = await getSessionUser();
      if (!sessionUser) {
        setUsername(null);
        setEmail(null);
        setUserId(null);
        return;
      }

      setUserId(sessionUser.id);
      setEmail(sessionUser.email);

      const { data, error } = await getUser(sessionUser.id);
      if (error) {
        console.error("Error fetching username:", error);
      } else {
        setUsername(data?.username ?? sessionUser.email ?? null);
      }
    };

    loadUser();
  }, []);

  const openFieldEditor = (field: SettingsField) => {
    setActiveField(field);
    setIsEditorOpen(true);
  };

  const closeFieldEditor = () => {
    setIsEditorOpen(false);
    setActiveField(null);
  };

  const handleFieldSave = async (value: string) => {
    if (!userId) return;

    if (activeField === "username") {
      const { error } = await updateUsername(value);
      if (error) {
        console.error("Failed to update username:", error);
      } else {
        setUsername(value.trim());
      }
    } else if (activeField === "email") {
      const { error } = await updateAuthEmail(value);
      if (error) {
        console.error("Failed to update email:", error);
      } else {
        setEmail(value);
      }
    }

    closeFieldEditor();
  };

  const handleDeleteAccount = async () => {
    setIsDeleteConfirmOpen(false);
    const { error } = await deleteCurrentAccount();
    if (error) {
      console.error(error);
      return;
    }
    router.push("/login");
  };

  const editorTitle =
    activeField === "username"
      ? "Edit Username"
      : activeField === "email"
      ? "Edit Email"
      : "Edit field";
  const editorLabel =
    activeField === "username"
      ? "Username"
      : activeField === "email"
      ? "Email"
      : "Value";
  const editorDescription =
    activeField === "username"
      ? "Update the username shown across your profile and posts."
      : "Update the email address used for logging in.";

  return (
    <>
      <div className="w-full h-full min-h-screen flex items-center justify-center">
        <div className="w-full max-w-2xl space-y-4">
          <h1 className="text-3xl font-bold">Settings</h1>

          <button
            onClick={() => openFieldEditor("username")}
            className="flex cursor-pointer w-full items-center justify-between rounded-2xl border border-white/10 bg-neutral-950 px-4 py-4 transition hover:border-white/20"
          >
            <div>Username</div>
            <div className="flex items-center gap-4">
              <div>{username ?? "–"}</div>
              <div className="rounded-xl px-2 py-1 transition hover:bg-white/10">
                <IoIosArrowForward size={20} />
              </div>
            </div>
          </button>

          <button
            onClick={() => openFieldEditor("email")}
            className="flex cursor-pointer w-full items-center justify-between rounded-2xl border border-white/10 bg-neutral-950 px-4 py-4 transition hover:border-white/20"
          >
            <div>Email</div>
            <div className="flex items-center gap-4">
              <div>{email ?? "–"}</div>
              <div className="rounded-xl px-2 py-1 transition hover:bg-white/10">
                <IoIosArrowForward size={20} />
              </div>
            </div>
          </button>

          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="flex cursor-pointer w-full items-center justify-between rounded-2xl border border-red-600 bg-red-950/40 px-4 py-4 text-red-300 transition hover:bg-red-900/50"
          >
            <div>Delete account</div>
            <div className="rounded-xl px-2 py-1 transition hover:bg-white/10">
              <IoIosArrowForward size={20} />
            </div>
          </button>
        </div>
      </div>

      <FieldEditorModal
        open={isEditorOpen}
        title={editorTitle}
        label={editorLabel}
        description={editorDescription}
        initialValue={activeField === "username" ? username ?? "" : email ?? ""}
        onClose={closeFieldEditor}
        onSave={handleFieldSave}
      />

      <ConfirmModal
        open={isDeleteConfirmOpen}
        title="Delete account"
        message="This will permanently delete your account and profile data. This action cannot be undone."
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </>
  );
}
