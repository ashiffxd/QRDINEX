'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateTableDialog } from './TableDialogs'

export function CreateTableButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        Add Table
      </button>

      <CreateTableDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
