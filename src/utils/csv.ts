import type { CallRecord } from '../types'

const headers = [
  'Call Title',
  'Account',
  'Contact',
  'Owner',
  'Sentiment',
  'Summary',
  'Next Steps',
  'Objections',
  'Action Items',
  'Tags',
  'Last Updated',
]

const escapeCell = (value: string) => {
  const sanitized = value.replace(/"/g, '""')
  return `"${sanitized}"`
}

export const serializeCallsToCsv = (calls: CallRecord[]) => {
  const rows = calls.map((call) =>
    [
      call.title,
      call.account,
      call.contact,
      call.owner,
      `${call.sentiment} (${(call.sentimentScore * 100).toFixed(0)}%)`,
      call.summary,
      call.nextSteps.join(' • '),
      call.objections.join(' • '),
      call.actionItems.join(' • '),
      call.tags.join(', '),
      new Date(call.updatedAt).toISOString(),
    ].map(escapeCell),
  )

  return [headers.map(escapeCell), ...rows].map((row) => row.join(',')).join('\n')
}

export const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
