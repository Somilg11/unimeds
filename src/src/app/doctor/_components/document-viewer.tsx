'use client';

import dynamic from 'next/dynamic';
import { X, FileText, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { ssr: false }
);
const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  onClose: () => void;
}

export function DocumentViewer({ fileUrl, fileName, mimeType, onClose }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfjsReady, setPdfjsReady] = useState(false);

  const isPdf = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
  const isImage = mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

  // Initialize pdf.js worker on client only
  useEffect(() => {
    if (!isPdf) return;
    import('react-pdf').then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      setPdfjsReady(true);
    });
  }, [isPdf]);

  // Fetch PDF as blob to bypass CORS issues with Cloudinary
  useEffect(() => {
    if (!isPdf) return;

    let blobUrl: string | null = null;
    let cancelled = false;

    const fetchPdf = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch PDF:', err);
          setLoadError('Failed to load PDF');
          setIsLoading(false);
        }
      }
    };

    fetchPdf();

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [fileUrl, isPdf]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  const onDocumentLoadSuccess = useCallback(({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    setCurrentPage(1);
    setIsLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF render error:', error);
    setLoadError('Failed to render PDF');
    setIsLoading(false);
  }, []);

  const goToPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(numPages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.2));
  const zoomOut = () => setScale((s) => Math.max(0.4, s - 0.2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="relative w-full h-full max-w-6xl mx-4 my-4 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="text-sm font-medium text-gray-900 truncate">{fileName}</span>
            {isPdf && numPages > 0 && (
              <span className="text-xs text-gray-400 shrink-0">
                Page {currentPage} of {numPages}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isPdf && numPages > 1 && (
              <div className="flex items-center gap-1 mr-3">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage >= numPages}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {(isPdf || isImage) && (
              <div className="flex items-center gap-1 mr-3">
                <button onClick={zoomOut} className="p-1 text-gray-400 hover:text-gray-600">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono text-gray-400 w-10 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button onClick={zoomIn} className="p-1 text-gray-400 hover:text-gray-600">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}
            <span className="text-[11px] font-medium uppercase text-gray-500 tracking-wider hidden sm:inline">
              View Only
            </span>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-start justify-center p-4">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
            </div>
          )}
          {loadError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">{loadError}</p>
              </div>
            </div>
          ) : isPdf ? (
            pdfBlobUrl && pdfjsReady && Document && Page ? (
              <Document
                file={pdfBlobUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                  </div>
                }
                error={
                  <div className="text-center py-20">
                    <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">Failed to load PDF</p>
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  className="shadow-lg"
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            ) : (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
              </div>
            )
          ) : isImage ? (
            <div className="flex items-center justify-center py-4">
              <img
                src={fileUrl}
                alt={fileName}
                crossOrigin="anonymous"
                style={{ transform: `scale(${scale})`, transformOrigin: 'center top' }}
                className="max-w-full shadow-lg transition-transform duration-200"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setLoadError('Failed to load image');
                  setIsLoading(false);
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Preview not available for this file type</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
