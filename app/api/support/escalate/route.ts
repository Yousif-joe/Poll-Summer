import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CONTACTS } from '@/lib/contacts'
import type { Topic } from '@/lib/contacts'

export async function POST(req: NextRequest) {
  const { topic, userQuestion } = await req.json()

  if (!topic || !['meal', 'systems'].includes(topic)) {
    return NextResponse.json({ error: 'Invalid topic' }, { status: 400 })
  }

  const contact = CONTACTS[topic as Topic]

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  await supabase.from('support_requests').insert({
    topic,
    assigned_to: contact.name,
    user_question: userQuestion ?? '',
  })

  return NextResponse.json({ contact })
}
