import type { Sentiment } from '../../types'

const styles: Record<Sentiment, string> = {
  Positive: 'bg-emerald-100 text-emerald-700',
  Neutral: 'bg-slate-100 text-slate-700',
  Negative: 'bg-rose-100 text-rose-700',
}

export const SentimentPill = ({
  sentiment,
  score,
}: {
  sentiment: Sentiment
  score?: number
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${styles[sentiment]}`}
  >
    <span>{sentiment}</span>
    {typeof score === 'number' && (
      <span className="font-semibold">{Math.round(score * 100)}%</span>
    )}
  </span>
)
