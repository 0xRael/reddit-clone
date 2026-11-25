const SECOND = 1000;
const MINUTE = 60 * SECOND;

export const STALE_TIMES = {
  // Fast-changing / debounce-style data
  notifications: 15 * SECOND,
  votes: 30 * SECOND,
  replies: 30 * SECOND,

  // Feeds & post details
  postsFeed: 1 * MINUTE,
  postDetail: 10 * MINUTE,

  // User & auth lookups
  authSession: 10 * MINUTE,
  userProfile: 30 * MINUTE,
  userBatch: 30 * MINUTE,

  // Communities (rarely change)
  communityMembership: 30 * MINUTE,
  communityDetails: 30 * MINUTE,
  communityDirectory: 30 * MINUTE,
} as const;

export const CACHE_LIFETIMES = {
  defaultQueryGc: 30 * MINUTE,
  persistedMaxAge: 30 * MINUTE,
} as const;
