import { type FormEvent, useEffect, useState } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { useCalls } from '../context/CallsContext'
import type { IntegrationStatus, SheetSettings } from '../types'

export const SheetSettingsPage = () => {
  const {
    sheetSettings,
    updateSheetSettings,
    integrationHealth,
    triggerHealthCheck,
  } = useCalls()
  const [localSettings, setLocalSettings] = useState<SheetSettings>(sheetSettings)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocalSettings(sheetSettings)
  }, [sheetSettings])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    updateSheetSettings(localSettings)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setSaving(false)
  }

  const statusStyles: Record<IntegrationStatus, string> = {
    connected: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-rose-600',
  }

  return (
    <>
      <PageHeader
        title="Google Sheet settings"
        subtitle="Control your Google Sheets destination, integration health, and sync cadence."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="glass-panel rounded-2xl p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold text-slate-900">
            Destination sheet
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-600">
              Google Sheet ID
              <input
                type="text"
                value={localSettings.sheetId}
                onChange={(event) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    sheetId: event.target.value,
                  }))
                }
                placeholder="1AbCDefGhIjkLmNo..."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Worksheet tab
              <input
                type="text"
                value={localSettings.worksheetName}
                onChange={(event) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    worksheetName: event.target.value,
                  }))
                }
                placeholder="Auto Notes"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Share with email
              <input
                type="email"
                value={localSettings.shareEmail}
                onChange={(event) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    shareEmail: event.target.value,
                  }))
                }
                placeholder="revops@company.com"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-600">
              Sync frequency
              <select
                value={localSettings.syncFrequency}
                onChange={(event) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    syncFrequency: event.target.value as SheetSettings['syncFrequency'],
                  }))
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="manual">Manual only</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
              </select>
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Auto-sync to Google Sheets
              </p>
              <p className="text-xs text-slate-500">
                When enabled, new calls sync automatically using the cadence
                above.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setLocalSettings((prev) => ({ ...prev, autoSync: !prev.autoSync }))
              }
              className={`relative flex h-7 w-12 items-center rounded-full transition ${
                localSettings.autoSync ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full bg-white shadow transition ${
                  localSettings.autoSync ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex items-center rounded-full bg-slate-900 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saving ? 'Saving...' : 'Save sheet settings'}
          </button>
        </form>

        <aside className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Integration health
              </h3>
              <span className={`text-sm font-semibold ${statusStyles[integrationHealth.status]}`}>
                {integrationHealth.status === 'connected'
                  ? 'Connected'
                  : integrationHealth.status === 'warning'
                  ? 'Degraded'
                  : 'Disconnected'}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {integrationHealth.message}
            </p>
            <dl className="mt-4 space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <dt>Latency</dt>
                <dd className="font-semibold text-slate-900">
                  {integrationHealth.latencyMs} ms
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Last checked</dt>
                <dd className="font-semibold text-slate-900">
                  {new Date(integrationHealth.lastChecked).toLocaleTimeString()}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={triggerHealthCheck}
              className="mt-4 w-full rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Run health check
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-6 bg-gradient-to-br from-brand-50 to-white">
            <h3 className="text-lg font-semibold text-slate-900">
              CSV Export
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Every export mirrors your sheet schema, so RevOps can plug the data
              into dashboards immediately.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-500">
              <li>• Summary + sentiment</li>
              <li>• Next steps + owners</li>
              <li>• Objections & risks</li>
              <li>• Automatic timestamps</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  )
}
