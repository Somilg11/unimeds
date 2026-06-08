'use client';

import { useCallback, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onUpload: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
}

export function UploadZone({
  onUpload,
  accept = 'image/*,.pdf',
  maxSize = 10 * 1024 * 1024, // 10MB default
  className,
  disabled = false,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const validateAndUpload = useCallback(
    async (file: File) => {
      // Validate file size
      if (file.size > maxSize) {
        alert(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        return;
      }

      // Validate file type
      if (accept && !file.type.match(accept.replace('*', '.*'))) {
        alert('Invalid file type');
        return;
      }

      setIsUploading(true);
      try {
        await onUpload(file);
      } finally {
        setIsUploading(false);
      }
    },
    [maxSize, accept, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        validateAndUpload(file);
      }
    },
    [disabled, isUploading, validateAndUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || isUploading) return;

      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        validateAndUpload(file);
      }
    },
    [disabled, isUploading, validateAndUpload]
  );

  return (
    <div
      className={cn(
        'border-2 border-dashed border-zinc-300 rounded-xl p-6 sm:p-8 lg:p-12 text-center',
        'bg-zinc-50 hover:bg-zinc-100/80 transition-all duration-300 cursor-pointer',
        'hover:border-zinc-400 hover:shadow-premium',
        isDragging && 'bg-zinc-100/80 border-zinc-950',
        (disabled || isUploading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer flex flex-col items-center"
      >
        {isUploading ? (
          <Loader2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 text-zinc-500 mb-3 animate-spin" />
        ) : (
          <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 text-zinc-500 mb-3" />
        )}
        <p className="text-sm sm:text-base font-medium text-zinc-900 tracking-tight">
          {isUploading ? 'Processing document...' : 'Drop medical documents here'}
        </p>
        <p className="text-xs text-zinc-600 mt-2">
          PDF, Images up to {maxSize / 1024 / 1024}MB
        </p>
      </label>
    </div>
  );
}
