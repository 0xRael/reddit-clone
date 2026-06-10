'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/component"
import FieldEditorModal from "@/components/FieldEditorModal"
import ConfirmModal from "@/components/ConfirmModal"
// Icons
import { IoIosArrowForward } from "react-icons/io";

type SettingsField = "username" | "email" | null

export default function SettingsPage() {
	const router = useRouter();
	const supabase = createClient();
	const [username, setUsername] = useState<string | null>(null);
	const [email, setEmail] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [activeField, setActiveField] = useState<SettingsField>(null);

	useEffect(() => {
		const loadUser = async () => {
			// get the current session
			const { data: { user } } = await supabase.auth.getUser()
			if (!user) {
				setUsername(null);
				setEmail(null);
				setUserId(null)
				return
			}
			
			setUserId(user.id);
            setEmail(user.email ?? null);

			const { data, error } = await supabase
			.from("users")
			.select("username")
			.eq("id", user.id)
			.single()

			if (error) {
				console.error("Error fetching username:", error)
			} else {
				setUsername(data?.username ?? user.email ?? null)
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

	const openFieldEditor = (field: SettingsField) => {
		setActiveField(field)
		setIsEditorOpen(true)
	}

	const closeFieldEditor = () => {
		setIsEditorOpen(false)
		setActiveField(null)
	}

	const handleFieldSave = (value: string) => {
        asyncHandleFileSave(value);
	}

    const asyncHandleFileSave = async (value:string) => {
        if (!userId) return;
        
        if (activeField === "username") {
            const { data, error } = await supabase
            .from("users")
            .update({ username: value })
            .eq("id", userId)

            setUsername(value);
        } else if (activeField === "email") {
            const { data, error } = await supabase.auth.updateUser({ email: value });

            setEmail(value);
        }

        closeFieldEditor()
    }

    const handleDeleteAccount = async () => {
        setIsDeleteConfirmOpen(false)

        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session?.access_token) {
            console.error('Unable to confirm current session before deleting account.', sessionError)
            return
        }

        const response = await fetch('/api/delete-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
        })

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}))
            console.error('Account deletion failed.', payload)
            return
        }

        await supabase.auth.signOut()
        router.push('/login')
    }

	const editorTitle = activeField === "username" ? "Edit Username" : activeField === "email" ? "Edit Email" : "Edit field"
	const editorLabel = activeField === "username" ? "Username" : activeField === "email" ? "Email" : "Value"
	const editorDescription = activeField === "username"
		? "Update the username shown across your profile and posts."
		: "Update the email address used for logging in."

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
    )
}