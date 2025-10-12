# Yet Another... Reddit Clone?
_Tired of seeing Twitter clones? Well... what about a Reddit clone instead?_

A Community/Forum Web Application inspired by Reddit's interface and interaction model. Built with **Supabase** and **Next.js**, this project showcases scalable authentication, real-time data, and dynamic layouts — all wrapped in a clean, dark-themed UI. (Currently WIP)

---

## 🚀 Features

- 🔐 **Auth & RLS** — Secure login/signup with Supabase Auth, plus row-level security for user-owned content
- 🗳️ **Post Voting** — Upvote/downvote system with scalable aggregation
- 🧵 **Comments** — Threaded discussion per post (coming soon)
- 🏘️ **Communities** — Group posts by topic, with dynamic routing and filtering (coming soon)
- 🕒 **Relative Timestamps** — Powered by `date-fns` (e.g. “40 min. ago”)
- 📦 **Deployed on Vercel** — Fast, serverless, and production-ready

---

## 🧱 Tech Stack

- **Frontend**: Next.js (App Router), Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, RLS, Edge Functions)
- **State**: React hooks, server/client separation
- **Deployment**: Vercel
- **Utilities**: `date-fns`, `react-icons`