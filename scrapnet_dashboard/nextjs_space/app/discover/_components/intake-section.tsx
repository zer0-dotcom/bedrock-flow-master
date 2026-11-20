'use client'

import { useState } from 'react'
import { AssetGrid } from './asset-grid'
import { ModuleSelector } from './module-selector'

export function IntakeSection() {
  const [selected, setSelected] = useState<string | null>(null)
  const [pulseKey, setPulseKey] = useState(0)

  return (
    <>
      <AssetGrid
        onSelectLive={(moduleId) => {
          setSelected(moduleId)
          setPulseKey((k) => k + 1)
        }}
      />
      <ModuleSelector selected={selected} onSelect={setSelected} pulseKey={pulseKey} />
    </>
  )
}
