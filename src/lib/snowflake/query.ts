import 'server-only'

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import Papa from 'papaparse'

const execFileAsync = promisify(execFile)

/**
 * Snowflake is reached through the bundled Python helper (RSA key-pair auth).
 * Override the interpreter / script path via env if they move.
 */
const PYTHON = process.env.SPIGEN_PYTHON ?? 'python'
const SCRIPT =
  process.env.SPIGEN_SF_SCRIPT ??
  'C:/Users/USER/.claude/skills/spigen-snowflake/scripts/sf_query.py'

/**
 * Run a read-only SQL query against the Spigen `S3` warehouse and return the
 * rows as objects keyed by (UPPERCASE) column name. Aggregate in SQL — these
 * tables are huge; never pull raw rows through here.
 */
export async function snowflakeQuery<T = Record<string, string>>(sql: string): Promise<T[]> {
  const out = join(tmpdir(), `sf_${randomUUID()}.csv`)
  try {
    await execFileAsync(PYTHON, [SCRIPT, sql, '--csv', out], {
      env: { ...process.env, PYTHONUTF8: '1' },
      maxBuffer: 1024 * 1024 * 128,
      timeout: 120_000,
      windowsHide: true,
    })
    const csv = (await readFile(out, 'utf-8')).replace(/^﻿/, '') // strip UTF-8 BOM
    const parsed = Papa.parse<T>(csv, { header: true, skipEmptyLines: true })
    return parsed.data
  } finally {
    await unlink(out).catch(() => {})
  }
}

/** Marketplaces with settlement data in the warehouse (Europe + Asia, no US). */
export const SETTLEMENT_COUNTRIES = ['DE', 'UK', 'FR', 'IT', 'ES', 'NL', 'BE'] as const
export type SettlementCountry = (typeof SETTLEMENT_COUNTRIES)[number]

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Guard a country code coming from the URL against the allow-list. */
export function safeCountry(raw: string | undefined): SettlementCountry {
  const up = (raw ?? 'DE').toUpperCase()
  return (SETTLEMENT_COUNTRIES as readonly string[]).includes(up)
    ? (up as SettlementCountry)
    : 'DE'
}

/** Guard an ISO date coming from the URL, falling back to a default. */
export function safeDate(raw: string | undefined, fallback: string): string {
  return raw && ISO_DATE.test(raw) ? raw : fallback
}
