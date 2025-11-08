import { useMemo, useState } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { StatCard } from '../components/common/StatCard'
import { CallTable } from '../components/calls/CallTable'
import { useCalls } from '../context/CallsContext'

export const CallsPage = () => {
  const { calls, exportCalls } = useCalls()
  const [query, setQuery] = useState('')
  const [sentimentFilter, setSentimentFilter] =
    useState<'all' | 'Positive' | 'Neutral' | 'Negative'>('all')

  const stats = useMemo(() => {
    if (!calls.length) {
      return {
        total: '0',
        positive: '0%',
        avgSentiment: '—',
        objections: '0 flagged',
      }
    }
    const positiveCalls = calls.filter((call) => call.sentiment === 'Positive')
    const averageScore =
      calls.reduce((acc, call) => acc + call.sentimentScore, 0) / calls.length
    const objections = calls.reduce(
      (acc, call) => acc + (call.objections?.length ?? 0),
      0,
    )

    return {
      total: `${calls.length}`,
      positive: `${Math.round((positiveCalls.length / calls.length) * 100)}%`,
      avgSentiment: `${Math.round(averageScore * 100)}%`,
      objections: `${objections} flagged`,
    }
  }, [calls])

  const filtered = useMemo(() => {
    const lower = query.toLowerCase()
    return calls.filter((call) => {
      const matchesQuery =
        !lower ||
        call.title.toLowerCase().includes(lower) ||
        call.account.toLowerCase().includes(lower) ||
        call.owner.toLowerCase().includes(lower)
      const matchesSentiment =
        sentimentFilter === 'all' || call.sentiment === sentimentFilter
      return matchesQuery && matchesSentiment
    })
  }, [calls, query, sentimentFilter])

  const sentimentTabs: {
    label: string
    value: typeof sentimentFilter
  }[] = [
    { label: 'All sentiment', value: 'all' },
    { label: 'Positive', value: 'Positive' },
    { label: 'Neutral', value: 'Neutral' },
    { label: 'Negative', value: 'Negative' },
  ]

  return (
    <>
      <PageHeader
        title="Processed call notes"
        subtitle="Review AI structured notes, next steps, and objections. Export to Google Sheets anytime."
        actions={
          <button
            onClick={exportCalls}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700"
          >
            Export CSV
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Calls processed" value={stats.total} helper="Last 30 days" />
        <StatCard
          label="Positive sentiment"
          value={stats.positive}
          trendBadge="+6% vs last week"
          tone="positive"
        />
        <StatCard
          label="Avg sentiment score"
          value={stats.avgSentiment}
          helper="Weighted by talk-time"
        />
        <StatCard
          label="Objections"
          value={stats.objections}
          helper="Requires follow-up"
          tone="warning"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Search by call title, account, or owner"
            className="flex-1 min-w-[220px] rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-50"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {sentimentTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSentimentFilter(tab.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  sentimentFilter === tab.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <CallTable calls={filtered} />
      </div>
    </>
  )
}
