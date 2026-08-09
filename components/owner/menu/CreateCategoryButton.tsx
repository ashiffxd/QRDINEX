'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateCategoryDialog } from './CategoryDialogs'

export function CreateCategoryButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        New Category
      </button>

      <CreateCategoryDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
