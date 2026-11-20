'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const BpsChartInner = dynamic(() => import('./bps-chart-inner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] flex items-center justify-center">
      <div className="text-gray-600 text-sm">Loading chart…</div>
    </div>
  ),
})

export function BpsChart() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) {
    return (
      <div className="w-full h-[280px] flex items-center justify-center">
        <div className="text-gray-600 text-sm">Loading chart…</div>
      </div>
    )
  }
  return <BpsChartInner />
}
