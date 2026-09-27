'use client'

import { useEffect } from 'react'

export function ServiceWorker() {
  useEffect(() => {
    // In dev the worker caches chunks that Fast Refresh then replaces.
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js')
  }, [])

  return null
}
