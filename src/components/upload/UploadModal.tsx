'use client'

interface UploadModalProps {
  open: boolean
  onClose: () => void
}

export function UploadModal({ open, onClose }: UploadModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-700" onClick={e => e.stopPropagation()}>
        <p className="text-white">Upload modal coming soon</p>
        <button onClick={onClose} className="mt-4 text-zinc-400 hover:text-white">Close</button>
      </div>
    </div>
  )
}
