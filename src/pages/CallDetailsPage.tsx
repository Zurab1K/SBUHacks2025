import { Link, useParams } from 'react-router-dom'
import { useCalls } from '../context/CallsContext'
import { PageHeader } from '../components/common/PageHeader'
import { SentimentPill } from '../components/common/SentimentPill'
import { StatusBadge } from '../components/common/StatusBadge'
import { formatDate, formatDateTime, formatDuration } from '../utils/formatters'

export const CallDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const { getCallById } = useCalls()
  const call = id ? getCallById(id) : undefined

  if (!call) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <p className="text-lg font-semibold text-slate-800">
          Call not found or still processing.
        </p>
        <Link
          to="/calls"
          className="mt-4 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to call list
        </Link>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title={call.title}
        subtitle={`${call.account} • ${call.owner}`}
        actions={
          <Link
            to="/calls"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to all calls
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <SentimentPill
              sentiment={call.sentiment}
              score={call.sentimentScore}
            />
            <StatusBadge status={call.status} />
            <span className="text-xs text-slate-500">
              Updated {formatDateTime(call.updatedAt)}
            </span>
          </div>

          <article className="mt-6 space-y-4 text-slate-700">
            <h3 className="text-sm uppercase tracking-wide text-slate-500">
              Executive summary
            </h3>
            <p className="text-base leading-relaxed">{call.summary}</p>
          </article>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Next steps
              </h4>
              <ul className="mt-3 space-y-3 text-sm text-slate-700">
                {call.nextSteps.map((step) => (
                  <li key={step} className="rounded-lg bg-slate-50 px-3 py-2">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Action items
              </h4>
              <ul className="mt-3 space-y-3 text-sm text-slate-700">
                {call.actionItems.map((item) => (
                  <li key={item} className="rounded-lg bg-slate-50 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Objections
            </h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {call.objections.map((objection) => (
                <div
                  key={objection}
                  className="rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-sm text-rose-700"
                >
                  {objection}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Call metadata
            </h3>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Contact</dt>
                <dd className="font-semibold text-slate-900">{call.contact}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Owner</dt>
                <dd className="font-semibold text-slate-900">{call.owner}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Duration</dt>
                <dd className="font-semibold text-slate-900">
                  {formatDuration(call.durationMinutes)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Created</dt>
                <dd className="font-semibold text-slate-900">
                  {formatDate(call.createdAt)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Tags & source
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {call.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 text-sm text-slate-600">
              <p>
                Source:{' '}
                <strong className="text-slate-900">
                  {call.transcriptSource === 'upload'
                    ? 'File upload'
                    : 'Pasted transcript'}
                </strong>
              </p>
              {call.transcriptName && (
                <p className="text-xs text-slate-500">{call.transcriptName}</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
