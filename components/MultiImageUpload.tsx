'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface MultiImageUploadProps {
  onImagesChanged: (urls: string[]) => void
  currentImageUrls?: string[]
  maxImages?: number
}

export function MultiImageUpload({
  onImagesChanged,
  currentImageUrls = [],
  maxImages = 5,
}: MultiImageUploadProps) {
  const [images, setImages] = useState<string[]>(currentImageUrls)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const maxSize = 5 * 1024 * 1024

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF')
        return
      }
      if (file.size > maxSize) {
        setError('File too large. Maximum size is 5MB')
        return
      }
    }

    const slotsRemaining = maxImages - images.length
    const filesToUpload = files.slice(0, slotsRemaining)

    setError('')
    setUploading(true)

    const uploadedUrls: string[] = []

    try {
      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Upload failed')
          return
        }

        uploadedUrls.push(data.url)
      }

      const newImages = [...images, ...uploadedUrls]
      setImages(newImages)
      onImagesChanged(newImages)
    } catch {
      setError('Failed to upload image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onImagesChanged(newImages)
  }

  const canAddMore = images.length < maxImages

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Images {images.length > 0 && `(${images.length}/${maxImages})`}
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
        {images.map((url, index) => (
          <div key={index} className="relative">
            <div className="relative h-32 rounded-lg overflow-hidden border border-gray-300">
              <Image
                src={url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
              />
              {index === 0 && (
                <span className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                  Primary
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              disabled={uploading}
              className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full text-base leading-none flex items-center justify-center hover:bg-red-700 disabled:opacity-50"
            >
              ×
            </button>
          </div>
        ))}

        {canAddMore && (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span className="text-gray-400 text-3xl leading-none">+</span>
            <span className="text-gray-500 text-xs mt-1">
              {uploading ? 'Uploading...' : 'Add photo'}
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        multiple
        className="hidden"
        disabled={uploading}
      />

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      <p className="text-xs text-gray-400 mt-1">
        JPEG, PNG, WebP, or GIF · Max 5MB each · Up to {maxImages} photos · First photo is the primary image
      </p>
    </div>
  )
}
