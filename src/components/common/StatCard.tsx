interface StatCardProps {
  label: string
  value: string
  helper?: string
  trendBadge?: string
  tone?: 'default' | 'positive' | 'warning' | 'negative'
}

const toneClasses: Record<
  NonNullable<StatCardProps['tone']>,
  { badge: string; value: string }
> = {
  default: { badge: 'bg-slate-100 text-slate-600', value: 'text-slate-900' },
  positive: { badge: 'bg-emerald-100 text-emerald-700', value: 'text-emerald-700' },
  warning: { badge: 'bg-amber-100 text-amber-700', value: 'text-amber-700' },
  negative: { badge: 'bg-rose-100 text-rose-700', value: 'text-rose-700' },
}

export const StatCard = ({
  label,
  value,
  helper,
  trendBadge,
  tone = 'default',
}: StatCardProps) => (
  <div className="glass-panel rounded-xl p-5">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <div className="mt-2 flex items-end gap-3">
      <span className={`text-3xl font-semibold ${toneClasses[tone].value}`}>
        {value}
      </span>
      {trendBadge && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${toneClasses[tone].badge}`}
        >
          {trendBadge}
        </span>
      )}
    </div>
    {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
  </div>
)
