'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

type Season = 'spring' | 'summer' | 'autumn' | 'winter'

const SEASONS: { key: Season; label: string; emoji: string; color: string }[] = [
  { key: 'spring', label: 'Spring', emoji: '🌸', color: 'bg-pink-100 hover:bg-pink-200 border-pink-300 text-pink-800' },
  { key: 'summer', label: 'Summer', emoji: '☀️', color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800' },
  { key: 'autumn', label: 'Autumn', emoji: '🍂', color: 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-800' },
  { key: 'winter', label: 'Winter', emoji: '❄️', color: 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800' },
]

const RESULT_COLORS: Record<Season, string> = {
  spring: 'bg-pink-400',
  summer: 'bg-yellow-400',
  autumn: 'bg-orange-400',
  winter: 'bg-blue-400',
}

type Counts = Record<Season, number>

const DEVICE_ID_KEY = 'poll_device_id'
const VOTED_KEY = 'poll_voted'

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = uuidv4()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

export default function PollPage() {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [counts, setCounts] = useState<Counts>({ spring: 0, summer: 0, autumn: 0, winter: 0 })
  const [voted, setVoted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0)

  // Load initial state on mount
  useEffect(() => {
    const id = getOrCreateDeviceId()
    setDeviceId(id)

    const alreadyVoted = localStorage.getItem(VOTED_KEY) === 'true'

    async function init() {
      try {
        // Fetch per-season counts from the view
        const { data, error: fetchError } = await supabase
          .from('season_counts')
          .select('season, total')

        if (fetchError) throw fetchError

        const initial: Counts = { spring: 0, summer: 0, autumn: 0, winter: 0 }
        for (const row of data ?? []) {
          if (row.season in initial) {
            initial[row.season as Season] = Number(row.total)
          }
        }
        setCounts(initial)

        // If localStorage says voted, trust it; otherwise check DB for this device
        if (alreadyVoted) {
          setVoted(true)
        } else {
          const { data: existing } = await supabase
            .from('votes')
            .select('id')
            .eq('device_id', id)
            .maybeSingle()

          if (existing) {
            localStorage.setItem(VOTED_KEY, 'true')
            setVoted(true)
          }
        }
      } catch (err) {
        setError('Failed to load poll data. Please refresh.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  // Subscribe to realtime inserts
  useEffect(() => {
    const channel = supabase
      .channel('votes-inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        (payload) => {
          const season = payload.new.season as Season
          if (season in counts) {
            setCounts((prev) => ({ ...prev, [season]: prev[season] + 1 }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleVote = useCallback(
    async (season: Season) => {
      if (!deviceId || voting) return
      setVoting(true)
      setError(null)

      const { error: insertError } = await supabase
        .from('votes')
        .insert({ season, device_id: deviceId })

      if (!insertError) {
        localStorage.setItem(VOTED_KEY, 'true')
        // Optimistically bump the count — realtime will also fire, but
        // the realtime event may arrive slightly after state update, so
        // we guard against double-counting by relying on realtime only
        // for other devices. Our own insert is counted once via the
        // realtime subscription that's already listening.
        setVoted(true)
      } else if (insertError.code === '23505') {
        // Unique violation — device already voted
        localStorage.setItem(VOTED_KEY, 'true')
        setVoted(true)
      } else {
        setError('Something went wrong. Please try again.')
        console.error(insertError)
      }

      setVoting(false)
    },
    [deviceId, voting]
  )

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-slate-500 text-lg animate-pulse">Loading poll…</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            What&apos;s your favorite season?
          </h1>
          <p className="text-slate-500 text-sm">
            {voted ? `${totalVotes} vote${totalVotes !== 1 ? 's' : ''} cast so far` : 'Cast your vote — results reveal after you vote'}
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!voted ? (
          /* Voting buttons */
          <div className="grid grid-cols-2 gap-4">
            {SEASONS.map(({ key, label, emoji, color }) => (
              <button
                key={key}
                onClick={() => handleVote(key)}
                disabled={voting}
                className={`
                  flex flex-col items-center gap-2 rounded-2xl border-2 px-6 py-8
                  font-semibold text-lg transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${color}
                `}
              >
                <span className="text-4xl">{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        ) : (
          /* Results */
          <div className="space-y-4">
            {SEASONS.map(({ key, label, emoji }) => {
              const count = counts[key]
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between items-center text-sm font-medium text-slate-700">
                    <span>
                      {emoji} {label}
                    </span>
                    <span>
                      {count} vote{count !== 1 ? 's' : ''} · {pct}%
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${RESULT_COLORS[key]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <p className="text-center text-xs text-slate-400 pt-2">
              Results update live — no refresh needed
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
