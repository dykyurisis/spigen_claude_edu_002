'use server'

import { HarmCategory, HarmBlockThreshold, FinishReason } from '@google/genai'
import { createClient } from '@/lib/supabase/server'
import { fetchAllData } from '@/lib/supabase/actions'
import { buildDataContext } from './buildContext'
import { getGeminiClient, GEMINI_MODEL } from './client'

export interface ChatTurn {
  role: 'user' | 'model'
  text: string
}

const SYSTEM_INSTRUCTION = `당신은 Spigen 독일(Amazon.de) 광고/판매 데이터 분석 어시스턴트입니다.
아래 제공된 집계 표만을 근거로 한국어로 간결하게 답하세요.
- 표에 없는 수치는 추측하지 말고 "데이터에 없습니다"라고 답하세요.
- 금액은 EUR(€), 날짜는 YYYY-MM 형식입니다.
- 계산이 필요하면 제공된 합계/평균/ROAS 값을 그대로 사용하고, 임의로 여러 행을 다시 합산하지 마세요.
- 개별 주문 한 건 같은 행 수준 상세는 표에 포함되어 있지 않습니다.`

// Internal business-data Q&A is benign, but Gemini's default safety thresholds
// occasionally false-positive on product/campaign vocabulary (e.g. "Tough
// Armor", "Gunmetal", "Bullet") and block the response. Relax them fully.
const SAFETY_SETTINGS = [
  HarmCategory.HARM_CATEGORY_HARASSMENT,
  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
].map(category => ({ category, threshold: HarmBlockThreshold.BLOCK_NONE }))

/** Ask Gemini a question about the dashboard data. Requires a logged-in user. */
export async function askGemini(question: string, history: ChatTurn[]): Promise<string> {
  const supabase = await createClient()
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError || !auth?.user) throw new Error('Not authenticated')

  const q = question.trim()
  if (!q) return '질문을 입력해 주세요.'

  try {
    const data = await fetchAllData()
    const context = buildDataContext(data)
    const ai = getGeminiClient()

    const contents = [
      // Recent history only — the data context rides along with the first turn.
      ...history.slice(-10).map(t => ({ role: t.role, parts: [{ text: t.text }] })),
      { role: 'user' as const, parts: [{ text: q }] },
    ]

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION}\n\n# 데이터 집계 표\n\n${context}`,
        temperature: 0.2,
        safetySettings: SAFETY_SETTINGS,
      },
    })

    if (response.text) return response.text

    // Empty response — log WHY so blocked requests are diagnosable.
    const blockReason = response.promptFeedback?.blockReason
    const finishReason = response.candidates?.[0]?.finishReason
    console.error('[askGemini] empty response:', { blockReason, finishReason })
    if (blockReason || finishReason === FinishReason.SAFETY || finishReason === FinishReason.PROHIBITED_CONTENT) {
      return '질문이 AI 안전 필터에 차단되었습니다. 표현을 바꿔 다시 질문해 주세요.'
    }
    return '답변을 생성하지 못했습니다. 다시 시도해 주세요.'
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[askGemini] failed:', msg)
    if (msg.includes('GEMINI_API_KEY')) {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다. 관리자에게 문의하세요.')
    }
    if (msg.includes('429') || /quota|RESOURCE_EXHAUSTED/i.test(msg)) {
      throw new Error('API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.')
    }
    throw new Error('답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
  }
}
