import { read, utils } from 'xlsx'

type SheetJson = Array<Record<string, unknown>>

export const spreadsheetToJsonString = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer()
  const workbook = read(buffer, { type: 'array' })

  if (!workbook.SheetNames.length) {
    throw new Error('No sheets detected in uploaded workbook.')
  }

  const sheets: Record<string, SheetJson> = {}

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) continue

    const rows = utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: null,
      blankrows: false,
    })

    sheets[sheetName] = rows
  }

  return JSON.stringify(
    {
      fileName: file.name,
      sheets,
    },
  )
}
