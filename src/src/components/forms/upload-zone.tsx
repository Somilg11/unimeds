'use client';

import { useCallback } from 'react';
import { Upload } from 'lucide-react';
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
  const validateAndUpload = useCallback(
    (file: File) => {
      // Validate file size
      if (file.size > maxSize) {
        alert(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        return;
      }

      // Validate file type
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
          alert('Invalid file type');
          return;
        }
      }

      onUpload(file);
    },
    [maxSize, accept, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        validateAndUpload(file);
      }
    },
    [disabled, validateAndUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        validateAndUpload(file);
      }
    },
    [disabled, validateAndUpload]
  );

  return (
    <div
      className={cn(
        'border-2 border-dashed border-border p-4 sm:p-6 lg:p-8 text-center',
        'hover:bg-muted/50 transition-colors cursor-pointer',
        'hover-lift',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer flex flex-col items-center"
      >
        <Upload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-muted-foreground mb-2" />
        <p className="text-xs sm:text-sm text-muted-foreground">
          Drop medical documents here
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-1">
          PDF, Images up to {maxSize / 1024 / 1024}MB
        </p>
      </label>
    </div>
  );
}
