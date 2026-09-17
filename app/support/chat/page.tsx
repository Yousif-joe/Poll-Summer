import { Suspense } from 'react'
import ChatClient from './ChatClient'

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-slate-500 animate-pulse">Loading…</div>
        </main>
      }
    >
      <ChatClient />
    </Suspense>
  )
}
