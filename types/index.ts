export type Community = {
  id: string
  name: string | null
  icon_url: string | null
  banner_url: string | null
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
  image_url: string | null
  users: {
    username: string
  }
  communities: {
    name: string | null,
    icon_url: string | null
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

export type Join = {
  id: string
  user_id: string
  community_id: string
  communities: {
    name: string,
    icon_url: string | null
  }
}