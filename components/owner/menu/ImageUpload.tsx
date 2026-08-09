'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('File must be an image')
      return
    }

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await fetch('/api/owner/menu/items/upload-image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Upload failed')

      onChange(data.data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-border h-32 w-32">
          <img src={value} alt="Menu Item Preview" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center h-32 w-32 rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors ${
            isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted hover:border-primary/50'
          }`}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">Upload Image</span>
            </>
          )}
        </div>
      )}
      
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
