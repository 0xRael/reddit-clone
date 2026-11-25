"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import FieldEditorModal from "@/components/FieldEditorModal";
import ConfirmModal from "@/components/ConfirmModal";
import { IoIosArrowForward } from "react-icons/io";
import { getSessionUserQueryOptions } from "@/utils/queries/auth";
import { userQueryOptions, updateUsername } from "@/utils/queries/users";
import {
  updateAuthEmail,
  deleteCurrentAccount,
} from "@/utils/queries/auth";

type SettingsField = "username" | "email" | null;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeField, setActiveField] = useState<SettingsField>(null);

  const sessionUserOpts = getSessionUserQueryOptions();
  const { data: sessionUser = null } = useQuery(sessionUserOpts);

  const userId = sessionUser?.id ?? null;
  const email = sessionUser?.email ?? null;

  const profileOpts = userQueryOptions(userId);
  const { data: profileUser = null } = useQuery({
    ...profileOpts,
    enabled: Boolean(userId),
  });

  const username = profileUser?.username ?? email ?? null;

  const saveFieldMutation = useMutation({
    mutationFn: async ({
      field,
      value,
    }: {
      field: Exclude<SettingsField, null>;
      value: string;
    }) => {
      if (!userId) throw new Error("Not authenticated");
      if (field === "username") {
        const { error } = await updateUsername(value);
        if (error) throw new Error(error);
      } else {
        const { error } = await updateAuthEmail(value);
        if (error) throw new Error(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionUserOpts.queryKey });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      closeFieldEditor();
    },
    onError: (err) => {
      console.error("Failed to update setting:", err);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const { error } = await deleteCurrentAccount();
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
    onError: (err) => {
      console.error(err);
    },
  });

  const openFieldEditor = (field: SettingsField) => {
    setActiveField(field);
    setIsEditorOpen(true);
  };

  const closeFieldEditor = () => {
    setIsEditorOpen(false);
    setActiveField(null);
  };

  const handleFieldSave = async (value: string) => {
    if (!userId || !activeField || saveFieldMutation.isPending) return;
    await saveFieldMutation.mutateAsync({ field: activeField, value });
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountMutation.isPending) return;
    setIsDeleteConfirmOpen(false);
    await deleteAccountMutation.mutateAsync();
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
