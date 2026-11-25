import { getListOfUsers } from '@/utils/queries/users';

// Matches @username when not preceded by a word char, @, or '[' (so @[user:id] isn't re-matched)
const USERNAME_MENTION_RE =
  /(^|[^\w@\[])@([a-zA-Z0-9_-]{1,30})/g;

export async function resolveMentionsToTokens(text: string): Promise<string> {
  if (!text || !text.includes("@")) {
    return text;
  }

  const foundUsernames = new Set<string>();
  for (const match of text.matchAll(USERNAME_MENTION_RE)) {
    foundUsernames.add(match[2]);
  }

  if (foundUsernames.size === 0) {
    return text;
  }

  const { data, error } = await getListOfUsers(Array.from(foundUsernames), 'username');

  if (error || data.length === 0) {
    console.error("Failed to resolve @mentions:", error);
    return text;
  }

  const usernameToId = new Map<string, string>();
  for (const user of data) {
    if (user.username) {
      usernameToId.set(user.username, user.id);
    }
  }

  if (usernameToId.size === 0) {
    return text;
  }

  return text.replace(
    USERNAME_MENTION_RE,
    (fullMatch: string, prefix: string, username: string) => {
      const userId = usernameToId.get(username);
      if (!userId) {
        return fullMatch;
      }
      return `${prefix}@[user:${userId}]`;
    }
  );
}
