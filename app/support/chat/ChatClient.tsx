'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

type Topic = 'meal' | 'systems'

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface Contact {
  name: string
  role: string
  email: string
}

const TOPIC_META: Record<Topic, { title: string; subtitle: string; emoji: string; accent: string }> = {
  meal: {
    title: 'MEAL Support',
    subtitle: 'Monitoring, Evaluation, Accountability & Learning',
    emoji: '📊',
    accent: 'bg-emerald-600',
  },
  systems: {
    title: 'Systems Support',
    subtitle: 'PowerSchool, data systems & technical processes',
    emoji: '💻',
    accent: 'bg-blue-600',
  },
}

export default function ChatClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const rawTopic = searchParams.get('topic')
  const topic: Topic | null = rawTopic === 'meal' || rawTopic === 'systems' ? rawTopic : null

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [escalated, setEscalated] = useState(false)
  const [escalating, setEscalating] = useState(false)
  const [contact, setContact] = useState<Contact | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!topic) router.replace('/support')
  }, [topic, router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading || !topic) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    setError(null)

    // Append streaming placeholder
    setMessages((prev) => [...prev, { role: 'assistant', content: '', streaming: true }])

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Server error ${res.status}`)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let text = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        const snapshot = text
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: snapshot, streaming: true }
          return next
        })
      }

      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: text }
        return next
      })
    } catch (err) {
      setMessages((prev) => prev.slice(0, -1))
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, messages, topic])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleEscalate = async () => {
    if (!topic || escalating || escalated) return
    setEscalating(true)
    setError(null)

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content ?? ''

    try {
      const res = await fetch('/api/support/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, userQuestion: lastUserMsg }),
      })

      if (!res.ok) throw new Error('Escalation failed')

      const { contact: c } = await res.json()
      setContact(c)
      setEscalated(true)
    } catch {
      setError('Could not connect to an engineer. Please try again.')
    } finally {
      setEscalating(false)
    }
  }

  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  if (!topic) return null

  const meta = TOPIC_META[topic]

  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.push('/support')}
          aria-label="Back to topic selection"
          className="text-slate-400 hover:text-slate-600 text-lg leading-none px-1"
        >
          ←
        </button>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 text-sm">
            {meta.emoji} {meta.title}
          </div>
          <div className="text-xs text-slate-400 truncate">{meta.subtitle}</div>
        </div>

        <button
          onClick={handleEscalate}
          disabled={escalating || escalated}
          className="shrink-0 text-xs rounded-lg px-3 py-1.5 font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {escalating ? 'Connecting…' : escalated ? '✓ Connected' : 'Talk to an engineer'}
        </button>
      </header>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && !escalated && (
          <div className="text-center text-slate-400 text-sm mt-12 space-y-2">
            <div className="text-4xl">{meta.emoji}</div>
            <p>Ask a {meta.title} question to get started.</p>
            <p className="text-xs">Answers are based on the internal knowledge base.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-slate-800 text-white rounded-br-sm'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.content || (msg.streaming ? '' : '…')}
              {msg.streaming && (
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-slate-400 animate-pulse rounded-sm align-middle" />
              )}
            </div>
          </div>
        ))}

        {/* Escalation confirmation card */}
        {escalated && contact && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-4 space-y-1">
            <div className="text-sm font-semibold text-emerald-800">Connected to support</div>
            <div className="text-sm text-emerald-700">
              {contact.name} · {contact.role}
            </div>
            <a
              href={`mailto:${contact.email}`}
              className="text-sm text-emerald-600 underline hover:text-emerald-800"
            >
              {contact.email}
            </a>
            <div className="text-xs text-emerald-500 pt-1">Your request has been logged.</div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={autoResize}
            disabled={loading}
            placeholder="Type your question… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 leading-relaxed overflow-hidden"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="shrink-0 bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '…' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-center">
          Answers are based on the internal knowledge base only.
        </p>
      </div>
    </main>
  )
}
