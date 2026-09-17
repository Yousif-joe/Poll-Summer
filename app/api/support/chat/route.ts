import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import type { Topic } from '@/lib/contacts'

const TOPIC_LABELS: Record<Topic, string> = {
  meal: 'MEAL (Monitoring, Evaluation, Accountability and Learning)',
  systems: 'Systems (PowerSchool, data systems, and technical processes)',
}

export async function POST(req: NextRequest) {
  const { topic, messages } = await req.json()

  if (!topic || !['meal', 'systems'].includes(topic)) {
    return new Response('Invalid topic', { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response('ANTHROPIC_API_KEY is not configured', { status: 503 })
  }

  // Fetch knowledge base for the topic from Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: knowledge } = await supabase
    .from('support_knowledge')
    .select('title, content')
    .eq('topic', topic)

  const knowledgeText = (knowledge ?? [])
    .map((k) => `### ${k.title}\n${k.content}`)
    .join('\n\n')

  const systemPrompt = `You are an internal support assistant for the ${TOPIC_LABELS[topic as Topic]} team. Help staff members solve problems and answer questions related to this topic.

Answer based solely on the knowledge base provided below. If the knowledge base does not cover the user's question, say clearly: "I don't have information about that in my knowledge base. You may want to connect to a support engineer who can help — use the button in the top right."

Be concise, step-by-step when explaining processes, and professional. Do not make up information not present in the knowledge base.

## Knowledge Base

${knowledgeText || 'No knowledge entries are available for this topic yet. Direct the user to connect to a support engineer.'}`

  const anthropic = new Anthropic({ apiKey })

  const stream = anthropic.messages.stream({
    model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-5',
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages as Anthropic.MessageParam[],
  })

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      stream.on('text', (text) => {
        controller.enqueue(encoder.encode(text))
      })
      try {
        await stream.finalMessage()
      } catch (err) {
        controller.error(err)
        return
      }
      controller.close()
    },
    cancel() {
      stream.abort()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
