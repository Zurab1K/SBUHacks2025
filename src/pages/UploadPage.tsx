import { type ChangeEvent, type FormEvent, useState } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { useCalls } from '../context/CallsContext'

type Mode = 'upload' | 'paste'

const metadataDefaults = {
  title: '',
  account: '',
  contact: '',
  owner: '',
}

export const UploadPage = () => {
  const { processTranscript, isProcessing } = useCalls()
  const [mode, setMode] = useState<Mode>('upload')
  const [metadata, setMetadata] = useState(metadataDefaults)
  const [transcriptText, setTranscriptText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file ?? null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(null)
    setError(null)

    try {
      let transcript = transcriptText.trim()
      let sourceName: string | undefined

      if (mode === 'upload') {
        if (!selectedFile) {
          setError('Attach a transcript file to process.')
          return
        }
        transcript = await selectedFile.text()
        sourceName = selectedFile.name
      } else if (!transcript) {
        setError('Paste a transcript to process.')
        return
      }

      if (!metadata.title) {
        setError('Give this call a title so you can find it later.')
        return
      }

      await processTranscript({
        transcript,
        metadata: {
          ...metadata,
          source: mode,
          sourceName,
        },
      })

      setFeedback('Transcript processed and added to your dashboard.')
      setMetadata(metadataDefaults)
      setTranscriptText('')
      setSelectedFile(null)
    } catch (err) {
      console.error(err)
      setError('Something went wrong while processing the transcript.')
    }
  }

  return (
    <>
      <PageHeader
        title="Upload or paste a call transcript"
        subtitle="Auto Notes converts raw conversations into shareable, structured notes ready for Google Sheets."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="glass-panel rounded-2xl p-6 lg:col-span-2"
        >
          <div className="mb-6 flex gap-2 rounded-full bg-slate-100 p-1 text-sm font-semibold">
            <button
              type="button"
              className={`flex-1 rounded-full px-4 py-2 ${
                mode === 'upload' ? 'bg-white shadow' : 'text-slate-500'
              }`}
              onClick={() => setMode('upload')}
            >
              Upload transcript file
            </button>
            <button
              type="button"
              className={`flex-1 rounded-full px-4 py-2 ${
                mode === 'paste' ? 'bg-white shadow' : 'text-slate-500'
              }`}
              onClick={() => setMode('paste')}
            >
              Paste transcript
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(['title', 'account', 'contact', 'owner'] as const).map((field) => (
              <label key={field} className="text-sm font-medium text-slate-600">
                <span className="mb-1 block capitalize">{field}</span>
                <input
                  type="text"
                  value={metadata[field]}
                  onChange={(event) =>
                    setMetadata((prev) => ({
                      ...prev,
                      [field]: event.target.value,
                    }))
                  }
                  placeholder={`Enter ${field}`}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </label>
            ))}
          </div>

          {mode === 'upload' ? (
            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center hover:border-brand-300 hover:bg-white">
              <span className="text-base font-semibold text-slate-700">
                Drop transcript file, or{' '}
                <span className="text-brand-600">browse</span>
              </span>
              <p className="text-sm text-slate-500">
                Supports .txt, .docx, and .vtt. Max 5 MB.
              </p>
              <input
                type="file"
                accept=".txt,.doc,.docx,.vtt"
                onChange={handleFile}
                className="hidden"
              />
              {selectedFile && (
                <p className="mt-4 rounded-full bg-white px-4 py-1 text-xs font-semibold text-brand-600 shadow-sm">
                  {selectedFile.name}
                </p>
              )}
            </label>
          ) : (
            <label className="mt-6 block text-sm font-semibold text-slate-600">
              Paste transcript
              <textarea
                className="mt-2 h-48 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                value={transcriptText}
                onChange={(event) => setTranscriptText(event.target.value)}
                placeholder="Paste the raw transcript. AI will summarize, extract next steps, and identify objections."
              />
            </label>
          )}

          {error && <p className="mt-4 text-sm text-rose-500">{error}</p>}
          {feedback && (
            <p className="mt-4 text-sm text-emerald-600">{feedback}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isProcessing ? 'Processing transcript...' : 'Generate AI notes'}
            </button>
            <p className="text-sm text-slate-500">
              Calls automatically appear in the dashboard when finished.
            </p>
          </div>
        </form>

        <aside className="space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-900">
              What you’ll get
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>• Executive-ready summary</li>
              <li>• Ranked next steps and action owners</li>
              <li>• Sentiment + objection detection</li>
              <li>• One-click export to Google Sheets</li>
            </ul>
          </div>

          <div className="glass-panel rounded-2xl p-6 bg-gradient-to-br from-brand-50 to-white">
            <h3 className="text-lg font-semibold text-slate-900">
              Power tip
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              The more context you include—agenda, participants, or goals—the
              richer the AI notes and follow-ups become.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
