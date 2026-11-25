import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/component";
import { getQueryClient } from "@/components/QueryProvider";
import { STALE_TIMES } from "@/utils/queryTimings";

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ? error.message : null };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  username: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  return { error: error ? error.message : null };
}

export async function signInWithGoogle(redirectTo: string): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
}

export async function getSessionUser(): Promise<{
  id: string;
  email: string | null;
} | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? null,
  };
}

export async function updateAuthEmail(
  email: string
): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ email });
  return { error: error ? error.message : null };
}

export async function deleteCurrentAccount(): Promise<{
  error: string | null;
}> {
  const supabase = createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return { error: "Unable to confirm current session before deleting account." };
  }

  const response = await fetch("/api/delete-account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    return { error: payload?.error ?? "Account deletion failed." };
  }

  await supabase.auth.signOut();
  getQueryClient().clear();
  return { error: null };
}

export async function signOutUser(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  getQueryClient().clear();
}

export function subscribeToAuthStateChange(callback: () => void): () => void {
  const supabase = createClient();
  const {
    data,
  } = supabase.auth.onAuthStateChange(() => {
    callback();
  });

  return () => {
    data && data.subscription.unsubscribe();
  };
}

// QUERY OPTIONS

export const getSessionUserQueryOptions = () =>
  queryOptions({
    queryKey: ["auth", "sessionUser"] as const,
    staleTime: STALE_TIMES.authSession,
    queryFn: getSessionUser,
  });
