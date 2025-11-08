import { Link } from 'react-router-dom'
import type { CallRecord } from '../../types'
import { SentimentPill } from '../common/SentimentPill'
import { StatusBadge } from '../common/StatusBadge'
import { formatDateTime } from '../../utils/formatters'

interface CallTableProps {
  calls: CallRecord[]
}

export const CallTable = ({ calls }: CallTableProps) => {
  if (!calls.length) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center text-slate-500">
        No calls processed yet. Upload your first transcript to see AI notes.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full table-fixed">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-6 py-3">Call</th>
            <th className="px-6 py-3">Sentiment</th>
            <th className="px-6 py-3">Next Steps</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {calls.map((call) => (
            <tr key={call.id} className="hover:bg-slate-50/60">
              <td className="px-6 py-4">
                <Link
                  to={`/calls/${call.id}`}
                  className="font-semibold text-slate-900 hover:text-brand-600"
                >
                  {call.title}
                </Link>
                <p className="text-xs text-slate-500">
                  {call.account} • {call.owner}
                </p>
              </td>
              <td className="px-6 py-4">
                <SentimentPill
                  sentiment={call.sentiment}
                  score={call.sentimentScore}
                />
              </td>
              <td className="px-6 py-4">
                <ul className="space-y-1 text-slate-600">
                  {call.nextSteps.slice(0, 2).map((step) => (
                    <li key={step} className="truncate">
                      {step}
                    </li>
                  ))}
                  {call.nextSteps.length > 2 && (
                    <li className="text-xs text-slate-400">
                      +{call.nextSteps.length - 2} more
                    </li>
                  )}
                </ul>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={call.status} />
              </td>
              <td className="px-6 py-4 text-slate-500">
                {formatDateTime(call.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
