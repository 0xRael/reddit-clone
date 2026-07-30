export type Community = {
  id: string
  name: string | null
  description: string | null
  created_at: string,
  owner_id: string
}

export type Post = {
  id: string
  title: string | null
  body: string | null
  community_id: string | null
  created_at: string
  users: {
    username: string
  }
  communities: {
    name: string | null
  }
  post_votes_view: {upvotes: number,downvotes: number}[],
  post_replies_view: {count: number}[]
}

export type Reply = {
	id: string,
	user_id: string,
	post_id: string | null,
	reply_id: string | null,
	text: string,
	created_at: string,
	users: {
		username: string
	}
}

export type Notification = {
  id: string
  actor_id?: string | null
  type: string
  reply_id: string | null
  post_id: string | null
  created_at: string
  read: boolean
  actor?: {
    username: string
  }
  reply?: {
      id: string,
      text: string,
      post_id: string
  }
}