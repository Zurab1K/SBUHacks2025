import type { ProcessingStatus } from '../../types'

const statusConfig: Record<ProcessingStatus, string> = {
  Ready: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Processing: 'bg-amber-50 text-amber-700 ring-amber-200',
  Failed: 'bg-rose-50 text-rose-700 ring-rose-200',
}

export const StatusBadge = ({ status }: { status: ProcessingStatus }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusConfig[status]}`}
  >
    {status}
  </span>
)
