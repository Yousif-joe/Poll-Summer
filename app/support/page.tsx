import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support Portal',
  description: 'Get help with MEAL or Systems topics.',
}

export default function SupportPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Support Portal</h1>
          <p className="text-slate-500 text-sm">Choose a topic — our assistant will answer from the knowledge base.</p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/support/chat?topic=meal"
            className="flex items-center gap-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-6 py-5 transition-all duration-150"
          >
            <span className="text-3xl">📊</span>
            <div>
              <div className="font-semibold text-emerald-900">MEAL</div>
              <div className="text-sm text-emerald-700">Monitoring, Evaluation, Accountability &amp; Learning</div>
            </div>
          </Link>

          <Link
            href="/support/chat?topic=systems"
            className="flex items-center gap-4 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 px-6 py-5 transition-all duration-150"
          >
            <span className="text-3xl">💻</span>
            <div>
              <div className="font-semibold text-blue-900">Systems</div>
              <div className="text-sm text-blue-700">PowerSchool, data systems &amp; technical processes</div>
            </div>
          </Link>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
