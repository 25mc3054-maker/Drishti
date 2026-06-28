"use client"
import { Toaster } from 'sonner'

export default function ClientToaster() {
  return (
    <Toaster
      position="top-right"
      theme="dark"
      toastOptions={{
        className: 'neon-panel border border-gemini-blue-500/35 text-gemini-blue-100',
      }}
    />
  )
}
