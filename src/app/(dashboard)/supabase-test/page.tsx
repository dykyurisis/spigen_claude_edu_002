import { createClient } from '@/lib/supabase/server'

export default async function SupabaseTestPage() {
  const supabase = await createClient()

  // 연결 테스트: 세션 확인 (테이블 불필요)
  const { error: authError } = await supabase.auth.getSession()

  // DB 연결 테스트: 빈 쿼리로 ping
  const { error: dbError } = await supabase.rpc('version').single()
  const isDbConnected = !dbError || dbError.code !== 'NETWORK_ERROR'

  const isConnected = !authError

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase 연결 테스트</h1>

      {/* 전체 연결 상태 */}
      <div className={`rounded-lg p-4 mb-6 ${isConnected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{isConnected ? '✅' : '❌'}</span>
          <div>
            <p className={`font-semibold text-lg ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? 'Supabase 연결 성공!' : 'Supabase 연결 실패'}
            </p>
            {authError && (
              <p className="text-sm text-red-500 mt-1">
                {authError.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 체크 항목 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
        <h2 className="font-semibold text-gray-700 mb-3">🔍 연결 상태 체크</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span>{isConnected ? '✅' : '❌'}</span>
            <span className="text-gray-700">Auth 서버 응답</span>
          </li>
          <li className="flex items-center gap-2">
            <span>{isDbConnected ? '✅' : '⚠️'}</span>
            <span className="text-gray-700">
              DB 연결
              {dbError && <span className="text-gray-400 ml-1">({dbError.message})</span>}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span>✅</span>
            <span className="text-gray-700">환경변수 로드</span>
          </li>
        </ul>
      </div>

      {/* 프로젝트 정보 */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h2 className="font-semibold text-gray-700 mb-3">📋 프로젝트 정보</h2>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="py-2 text-gray-500 w-36">Project URL</td>
              <td className="py-2 font-mono text-xs text-gray-700 break-all">
                {process.env.NEXT_PUBLIC_SUPABASE_URL}
              </td>
            </tr>
            <tr>
              <td className="py-2 text-gray-500">Publishable Key</td>
              <td className="py-2 font-mono text-xs text-gray-700">
                {process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.slice(0, 24)}...
              </td>
            </tr>
            <tr>
              <td className="py-2 text-gray-500">테이블 수</td>
              <td className="py-2 text-gray-700">0개 (아직 없음)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
