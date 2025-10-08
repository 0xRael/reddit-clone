'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/component'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  async function logIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return console.error(error)
    router.push('/')
  }

  async function signUp() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    })
    if (error) return console.error(error)
    router.push('/')
  }

  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          isSignUp ? signUp() : logIn()
        }}
        className="bg-black p-6 rounded-xl space-y-5 w-96"
      >
        <h1 className="text-xl font-semibold text-center">
          {isSignUp ? 'Sign Up' : 'Log In'}
        </h1>

        {/* Transition wrapper */}
        <div
          className={`transition-all duration-500 overflow-hidden ${
            isSignUp ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <input
            placeholder="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="block w-full border-white border-b bg-white/10 hover:bg-white/20 p-3 rounded-lg mb-3"
          />
        </div>

        <input
          placeholder="E-Mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full border-white border-b bg-white/10 hover:bg-white/20 p-3 rounded-lg"
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full border-white border-b bg-white/10 hover:bg-white/20 p-3 rounded-lg"
        />

        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm underline"
        >
          {isSignUp
            ? 'Already have an account? Log in'
            : "Don’t have an account yet? Sign up"}
        </button>

        <hr className="border-gray-700" />

        <button
          type="submit"
          className="p-3 rounded-lg w-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          {isSignUp ? 'Sign Up' : 'Log In'}
        </button>
      </form>
    </div>
  )
}
