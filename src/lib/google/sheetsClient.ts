import { google } from 'googleapis'
import type { sheets_v4 } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

const DEFAULT_SHEET_ID = '1IzFND4yIL4lme2hit47_x03GY-kYZHrpwXHlkJUgK1w'

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY
  if (email && key) {
    // Local dev: service account key from .env
    return new google.auth.JWT({
      email,
      key: key.replace(/\\n/g, '\n'),
      scopes: SCOPES,
    })
  }
  // Cloud Run: Application Default Credentials via the attached service account
  return new google.auth.GoogleAuth({ scopes: SCOPES })
}

export function getSheetId(): string {
  return process.env.GOOGLE_SHEET_ID ?? DEFAULT_SHEET_ID
}

/**
 * Fetch multiple tab ranges in a single Sheets API call.
 * `ranges` accepts bare tab titles (e.g. '주문') — the client lib URL-encodes them.
 * Returned valueRanges are in the SAME ORDER as the requested ranges.
 */
export async function batchGetTabs(
  ranges: string[]
): Promise<sheets_v4.Schema$ValueRange[]> {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() })
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: getSheetId(),
    ranges,
    valueRenderOption: 'FORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })
  return res.data.valueRanges ?? []
}
