'use client';

import { useCallback, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UploadZoneProps {
  onUpload: (file: File) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

export function UploadZone({
  onUpload,
  accept = 'image/*,.pdf',
  maxSize = 10 * 1024 * 1024,
  className,
  disabled = false,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const validateAndUpload = useCallback(
    async (file: File) => {
      if (file.size > maxSize) {
        toast.error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        return;
      }

      if (accept) {
        const accepted = accept.split(',').map((t) => t.trim());
        const isAccepted = accepted.some((a) => {
          if (a.startsWith('.')) {
            return file.name.toLowerCase().endsWith(a.toLowerCase());
          }
          if (a.endsWith('/*')) {
            return file.type.startsWith(a.replace('/*', '/'));
          }
          return file.type === a;
        });
        if (!isAccepted) {
          toast.error('Invalid file type');
          return;
        }
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
        validateAndUpload(files[0]);
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
        validateAndUpload(files[0]);
      }
    },
    [disabled, isUploading, validateAndUpload]
  );

  return (
    <div
      className={cn(
        'border border-dashed border-gray-300 p-8 sm:p-12 text-center',
        'bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer',
        'hover:border-gray-400',
        isDragging && 'bg-gray-100 border-gray-900',
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
          <Loader2 className="mx-auto h-10 w-10 text-gray-400 mb-3 animate-spin" />
        ) : (
          <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        )}
        <p className="text-sm font-medium text-gray-900">
          {isUploading ? 'Processing document...' : 'Drop medical documents here'}
        </p>
        <p className="text-[11px] font-mono uppercase text-gray-400 mt-2 tracking-wider">
          PDF, Images up to {maxSize / 1024 / 1024}MB
        </p>
      </label>
    </div>
  );
}
