import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import {
  isFinancialAgentConfigured,
  runFinancialHealthAgent,
  buildMockFinancialReport,
  type FinancialHealthInput,
  type FinancialHealthReport,
} from '../utils/neuralseek'
import { spreadsheetToJsonString } from '../utils/excel'

const emptyForm: FinancialHealthInput = {
  companyName: '',
  reportingPeriod: '',
  balanceSheet: '',
  incomeStatement: '',
  cashflowStatement: '',
}

const statementFields = [
  {
    field: 'balanceSheet',
    label: 'Balance sheet workbook',
    helper: 'Upload the Excel export that lists assets, liabilities, and equity.',
  },
  {
    field: 'incomeStatement',
    label: 'Income statement workbook',
    helper: 'Upload the Excel P&L export for the selected period.',
  },
  {
    field: 'cashflowStatement',
    label: 'Cash flow statement workbook',
    helper: 'Upload the Excel export with operating, investing, and financing sections.',
  },
] as const

type StatementField = (typeof statementFields)[number]['field']

const statusStyles: Record<string, string> = {
  Strong: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Stable: 'bg-sky-50 text-sky-700 border-sky-100',
  Watch: 'bg-amber-50 text-amber-700 border-amber-100',
  'At Risk': 'bg-rose-50 text-rose-700 border-rose-100',
  Unknown: 'bg-slate-50 text-slate-600 border-slate-100',
}

export const FinancialHealthPage = () => {
  const [form, setForm] = useState<FinancialHealthInput>(emptyForm)
  const [report, setReport] = useState<FinancialHealthReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Record<StatementField, string | null>>({
    balanceSheet: null,
    incomeStatement: null,
    cashflowStatement: null,
  })

  const agentConfigured = useMemo(() => isFinancialAgentConfigured(), [])

  const updateField = (field: keyof FinancialHealthInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const clearStatement = (field: StatementField) => {
    setUploadedFiles((prev) => ({ ...prev, [field]: null }))
    updateField(field, '')
  }

  const handleSpreadsheetUpload = async (
    field: StatementField,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      clearStatement(field)
      return
    }

    const lowerName = file.name.toLowerCase()
    const isSpreadsheet =
      file.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.xls') ||
      lowerName.endsWith('.csv')

    if (!isSpreadsheet) {
      setError('Upload Excel exports (.xlsx or .xls) from your finance system.')
      event.target.value = ''
      return
    }

    try {
      const jsonString = await spreadsheetToJsonString(file)
      updateField(field, jsonString)
      setUploadedFiles((prev) => ({ ...prev, [field]: file.name }))
      setError(null)
    } catch (err) {
      console.error(err)
      clearStatement(field)
      setError('We could not parse that spreadsheet. Export a clean .xlsx and re-upload.')
    } finally {
      event.target.value = ''
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!form.companyName.trim()) {
      setError('Add your company name so we can tag the report.')
      return
    }

    if (!form.balanceSheet || !form.incomeStatement || !form.cashflowStatement) {
      setError('Upload the balance sheet, income statement, and cash flow Excel workbooks.')
      return
    }

    try {
      setIsLoading(true)
      const result = agentConfigured
        ? await runFinancialHealthAgent(form)
        : buildMockFinancialReport(form)
      setReport(result)
    } catch (err) {
      console.error(err)
      setError(
        agentConfigured
          ? 'NeuralSeek could not score your financials. Double-check the .env values and try again.'
          : 'We could not derive a mock score from the converted Excel statements. Clean up the data and retry.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const renderList = (title: string, items: string[]) => (
    <div className="glass-panel rounded-2xl p-5">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {items.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No data returned.</p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial health snapshot"
        subtitle="Upload the Excel exports for your balance sheet, income statement, and cash flow. We convert them to JSON for NeuralSeek to summarize runway, strengths, and risks."
      />

      {!agentConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          NeuralSeek isn&apos;t connected yet—set `VITE_NEURALSEEK_FIN_AGENT` plus the base URL and API
          key in `.env`. We&apos;ll use a local heuristic model until those credentials are ready.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Company name
              <input
                type="text"
                value={form.companyName}
                onChange={(event) => updateField('companyName', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="Acme Corp"
              />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Reporting period
              <input
                type="text"
                value={form.reportingPeriod}
                onChange={(event) => updateField('reportingPeriod', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="Q3 FY25"
              />
            </label>
          </div>

          <div className="mt-2 space-y-4">
            {statementFields.map(({ field, label, helper }) => (
              <div key={field} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-700">{label}</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          uploadedFiles[field]
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span
                          className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${
                            uploadedFiles[field] ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                          aria-hidden="true"
                        />
                        {uploadedFiles[field] ? 'Uploaded' : 'Awaiting file'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{helper}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => clearStatement(field)}
                    disabled={!uploadedFiles[field]}
                    className="text-xs font-semibold text-slate-400 transition hover:text-rose-500 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Clear
                  </button>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  onChange={(event) => void handleSpreadsheetUpload(field, event)}
                  className="mt-3 block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-slate-900 file:px-5 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                <p className="mt-2 text-xs text-slate-500">
                  {uploadedFiles[field]
                    ? `Loaded ${uploadedFiles[field]}.`
                    : 'No file selected yet.'}
                </p>
              </div>
            ))}
          </div>

          {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isLoading ? 'Scoring financial health…' : 'Analyze financial health'}
            </button>
            <p className="text-sm text-slate-500">
              NeuralSeek highlights strengths, risks, and runway from the statements.
            </p>
          </div>
        </form>

        <div className="space-y-4">
          {report ? (
            <div className="space-y-4">
              <div
                className={`rounded-2xl border p-5 ${
                  statusStyles[report.status] ?? statusStyles.Unknown
                }`}
              >
                <p className="text-xs uppercase tracking-wide">Overall Health</p>
                <h3 className="mt-1 text-2xl font-semibold">{report.status}</h3>
                <p className="mt-2 text-sm">
                  Score: <span className="font-semibold">{report.score.toFixed(2)}</span>
                  {report.reportingPeriod && ` · ${report.reportingPeriod}`}
                </p>
                <p className="mt-3 text-sm text-slate-700">{report.summary}</p>
                <dl className="mt-4 grid gap-3 text-sm">
                  {report.liquiditySignal && (
                    <div>
                      <dt className="text-xs uppercase text-slate-500">Liquidity</dt>
                      <dd className="font-medium text-slate-900">{report.liquiditySignal}</dd>
                    </div>
                  )}
                  {report.profitabilitySignal && (
                    <div>
                      <dt className="text-xs uppercase text-slate-500">Profitability</dt>
                      <dd className="font-medium text-slate-900">{report.profitabilitySignal}</dd>
                    </div>
                  )}
                  {report.runwaySignal && (
                    <div>
                      <dt className="text-xs uppercase text-slate-500">Runway</dt>
                      <dd className="font-medium text-slate-900">{report.runwaySignal}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {renderList('Core strengths', report.strengths)}
              {renderList('Watch outs', report.risks)}
              {renderList('Recommended actions', report.recommendations)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Submit your financials to see instant health scoring, runway signals, and action items.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
