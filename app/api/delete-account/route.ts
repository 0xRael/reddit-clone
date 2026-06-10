import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for account deletion.')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const accessToken = authHeader?.replace(/^Bearer\s+/i, '')

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !userData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = userData.user.id

  const { error: deleteProfileError } = await supabase.from('users').delete().eq('id', userId)
  if (deleteProfileError) {
    return NextResponse.json({ error: deleteProfileError.message }, { status: 500 })
  }

  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId)
  if (deleteUserError) {
    return NextResponse.json({ error: deleteUserError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
