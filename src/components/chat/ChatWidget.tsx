'use client'
import { useEffect, useRef, useState } from 'react'
import { askGemini, type ChatTurn } from '@/lib/gemini/chat-actions'

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatTurn[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, loading])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    const history = messages
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)
    try {
      const answer = await askGemini(q, history)
      setMessages(prev => [...prev, { role: 'model', text: answer }])
    } catch (err) {
      const text = err instanceof Error ? err.message : '오류가 발생했습니다.'
      setMessages(prev => [...prev, { role: 'model', text: `⚠ ${text}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close AI chat' : 'Open AI chat'}
        className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-pink-600 hover:bg-pink-500 text-white text-xl shadow-lg shadow-black/40 transition-colors flex items-center justify-center"
      >
        {open ? '✕' : '✦'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[92vw] max-w-sm h-[480px] flex flex-col rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/50">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-100">✦ AI 데이터 어시스턴트</p>
              <p className="text-[11px] text-zinc-500">Gemini가 대시보드 데이터를 분석해 답해 드려요</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                className="text-[11px] text-zinc-500 hover:text-zinc-300"
              >
                초기화
              </button>
            )}
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-xs text-zinc-500 space-y-2 px-1 pt-2">
                <p>예시 질문:</p>
                <p>• ROAS가 가장 높은 SP 캠페인은?</p>
                <p>• 재고 위험 상품 알려줘</p>
                <p>• 3월 광고비 대비 매출 어때?</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs whitespace-pre-wrap leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-pink-600/90 text-white'
                      : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-400 animate-pulse">
                  분석 중...
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-zinc-800 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) send() }}
              placeholder="데이터에 대해 질문하세요…"
              maxLength={500}
              className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-600"
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              className="rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs px-3 transition-colors"
            >
              전송
            </button>
          </div>
        </div>
      )}
    </>
  )
}
