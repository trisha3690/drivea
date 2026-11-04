import React, { useCallback, useEffect, useState } from 'react'
import api from '../../config/api';
import { 
  AlertCircleIcon, 
  CheckIcon, 
  CopyIcon, 
  DownloadIcon, 
  ExternalLinkIcon, 
  FileTextIcon, 
  Loader2Icon, 
  RefreshCwIcon, 
  XIcon 
} from 'lucide-react';
import { formatBytes } from '../../assets/assets';

// Determine file preview category based on MIME type and file extension
const detectFileType = (file) => {
  const mime = (file?.mime_type || "").toLowerCase();
  const name = (file?.name || file?.original_name || "").toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() : "";

  const imageExts = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "avif"];
  const videoExts = ["mp4", "webm", "ogg", "mov", "mkv", "avi", "m4v"];
  const audioExts = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"];
  const textExts = [
    "txt", "md", "markdown", "json", "js", "jsx", "ts", "tsx", "html", "css", 
    "py", "csv", "xml", "log", "env", "yml", "yaml", "sh", "sql", "c", "cpp", "java"
  ];

  if (mime.startsWith("image/") || imageExts.includes(ext)) return "image";
  if (mime.startsWith("video/") || videoExts.includes(ext)) return "video";
  if (mime.startsWith("audio/") || audioExts.includes(ext)) return "audio";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.startsWith("text/") || mime === "application/json" || textExts.includes(ext)) return "text";
  return "other";
};

const FilePreview = ({ file, onClose }) => {
    const [previewUrl, setPreviewUrl] = useState(file?.url || file?.preview_url || null);
    const [isLoading, setIsLoading] = useState(!file?.url && !file?.preview_url);
    const [error, setError] = useState(null);
    const [mediaError, setMediaError] = useState(false);
    const [textContent, setTextContent] = useState(null);
    const [isTextLoading, setIsTextLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const fileType = detectFileType(file);

    const fetchPreviewUrl = useCallback(async () => {
        if (!file?.id) {
            if (file?.url || file?.preview_url) {
                setPreviewUrl(file.url || file.preview_url);
                setIsLoading(false);
                return;
            }
            setError("File ID not provided.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setMediaError(false);

        try {
            const { data } = await api.get(`/api/files/${file.id}/preview`);
            const url = data?.url || data?.preview_url || data?.file?.url || null;
            if (url) {
                setPreviewUrl(url);
            } else {
                setError("Preview URL not found in server response.");
            }
        } catch (err) {
            const msg = err.response?.data?.error || err.message || "Failed to load file preview";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [file]);

    useEffect(() => {
        if (file) {
            fetchPreviewUrl();
        }
    }, [file, fetchPreviewUrl]);

    // If file is text or code, fetch text content for inline rendering
    useEffect(() => {
        if (fileType === "text" && previewUrl) {
            let active = true;
            setIsTextLoading(true);

            fetch(previewUrl)
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch text content");
                    return res.text();
                })
                .then((text) => {
                    if (active) {
                        // Limit to first 150KB for snappy rendering
                        setTextContent(text.slice(0, 150000));
                    }
                })
                .catch(() => {
                    if (active) setTextContent(null);
                })
                .finally(() => {
                    if (active) setIsTextLoading(false);
                });

            return () => {
                active = false;
            };
        }
    }, [fileType, previewUrl]);

    const handleCopyText = () => {
        if (!textContent) return;
        navigator.clipboard.writeText(textContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (!file) return null;

    return (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
        >
            {/* Modal Box */}
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl flex flex-col max-h-[92vh] overflow-hidden animate-slide-up shadow-2xl"
            >
                {/* Top Bar */}
                <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2 sm:pr-4">
                        <FileTextIcon className="size-4 sm:size-5 text-orange-600 shrink-0"/>
                        <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-medium text-slate-900 truncate" title={file.name}>
                                {file.name}
                            </h3>
                            <p className="text-[11px] sm:text-xs text-slate-500">
                                {formatBytes(file.size)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {previewUrl && (
                            <>
                                <a 
                                  href={previewUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                                  title="Open in new tab"
                                >
                                    <ExternalLinkIcon className="size-3.5" />
                                    <span className="hidden sm:inline">Open</span>
                                </a>

                                <a 
                                  href={previewUrl}
                                  download={file.name}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition"
                                  title="Download file"
                                >
                                    <DownloadIcon className="size-3.5" />
                                    <span className="hidden sm:inline">Download</span>
                                </a>
                            </>
                        )}
                        <button 
                          onClick={onClose} 
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition" 
                          aria-label="Close preview"
                        >
                            <XIcon className="size-5"/>
                        </button>
                    </div>
                </div>

                {/* Preview Content Area */}
                <div className="flex-1 p-3 sm:p-6 overflow-auto flex items-center justify-center bg-slate-50 min-h-60 sm:min-h-96">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-3 text-slate-500 py-12">
                            <Loader2Icon className="size-8 animate-spin text-orange-600"/>
                            <p className="text-sm font-medium">Loading preview...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center p-6 bg-white border border-red-200 rounded-2xl max-w-md w-full space-y-3 shadow-xs">
                            <AlertCircleIcon className="size-10 text-red-500 mx-auto" />
                            <h4 className="text-sm font-semibold text-slate-900">Failed to load preview</h4>
                            <p className="text-xs text-red-600 break-words">{error}</p>
                            <div className="pt-2 flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={fetchPreviewUrl}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                                >
                                    <RefreshCwIcon className="size-3.5" />
                                    <span>Retry</span>
                                </button>
                            </div>
                        </div>
                    ) : mediaError ? (
                        /* Graceful fallback if media URL fails to render */
                        <div className="text-center p-6 bg-white border border-slate-200 rounded-2xl w-full max-w-md space-y-3 shadow-xs">
                            <FileTextIcon className="size-10 text-slate-400 mx-auto" />
                            <h4 className="text-sm font-semibold text-slate-900">Inline preview unavailable</h4>
                            <p className="text-xs text-slate-500">
                                This file cannot be displayed directly inside the browser, but you can open or download it.
                            </p>
                            {previewUrl && (
                                <div className="pt-2 flex items-center justify-center gap-2">
                                    <a 
                                      href={previewUrl} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                                    >
                                        <ExternalLinkIcon className="size-3.5" />
                                        <span>Open in tab</span>
                                    </a>
                                    <a 
                                      href={previewUrl} 
                                      download={file.name} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition"
                                    >
                                        <DownloadIcon className="size-3.5" />
                                        <span>Download</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : fileType === "image" && previewUrl ? (
                        <div className="flex items-center justify-center w-full h-full">
                            <img 
                              src={previewUrl} 
                              alt={file.name} 
                              onError={() => setMediaError(true)}
                              className="max-h-[70vh] max-w-full object-contain rounded-xl border border-slate-200 shadow-sm"
                            />
                        </div>
                    ) : fileType === "video" && previewUrl ? (
                        <div className="flex items-center justify-center w-full h-full">
                            <video 
                              src={previewUrl} 
                              controls 
                              onError={() => setMediaError(true)}
                              className="max-h-[70vh] max-w-full rounded-xl border border-slate-200 shadow-sm"
                            />
                        </div>
                    ) : fileType === "audio" && previewUrl ? (
                        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-4 w-full max-w-md shadow-xs">
                            <p className="text-sm text-slate-800 font-semibold truncate max-w-full">{file.name}</p>
                            <audio 
                              src={previewUrl} 
                              controls 
                              onError={() => setMediaError(true)}
                              className="w-full"
                            />
                        </div>
                    ) : fileType === "pdf" && previewUrl ? (
                        <div className="w-full h-[70vh] flex flex-col rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                            <iframe 
                              src={previewUrl} 
                              title={file.name} 
                              onError={() => setMediaError(true)}
                              className="w-full h-full"
                            />
                        </div>
                    ) : fileType === "text" ? (
                        isTextLoading ? (
                            <div className="flex flex-col items-center gap-3 text-slate-500 py-12">
                                <Loader2Icon className="size-6 animate-spin text-orange-600"/>
                                <p className="text-xs font-medium">Loading text content...</p>
                            </div>
                        ) : textContent !== null ? (
                            <div className="w-full flex flex-col max-h-[70vh] bg-slate-900 rounded-xl overflow-hidden shadow-sm">
                                <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-slate-300 text-xs border-b border-slate-700">
                                    <span className="font-mono truncate">{file.name}</span>
                                    <button
                                      type="button"
                                      onClick={handleCopyText}
                                      className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition"
                                    >
                                        {isCopied ? <CheckIcon className="size-3.5 text-emerald-400" /> : <CopyIcon className="size-3.5" />}
                                        <span>{isCopied ? "Copied" : "Copy"}</span>
                                    </button>
                                </div>
                                <pre className="p-4 text-xs font-mono text-slate-100 overflow-auto whitespace-pre-wrap break-all leading-relaxed flex-1">
                                    {textContent}
                                </pre>
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-white border border-slate-200 rounded-2xl w-full max-w-sm space-y-3 shadow-xs">
                                <FileTextIcon className="size-10 text-slate-400 mx-auto" />
                                <p className="text-sm text-slate-700 font-medium">Text preview unavailable</p>
                                {previewUrl && (
                                    <a 
                                      href={previewUrl} 
                                      download={file.name}
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition"
                                    >
                                        <DownloadIcon className="size-3.5" />
                                        <span>Download File</span>
                                    </a>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="text-center p-6 sm:p-10 bg-white border border-slate-200 rounded-2xl w-full max-w-sm space-y-3 shadow-xs">
                            <FileTextIcon className="size-10 sm:size-12 text-slate-400 mx-auto" />
                            <h4 className="text-sm font-semibold text-slate-900">{file.name}</h4>
                            <p className="text-xs text-slate-500">No direct inline preview available for this file type.</p>
                            {previewUrl && (
                                <div className="pt-2 flex items-center justify-center gap-2">
                                    <a 
                                      href={previewUrl} 
                                      download={file.name} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition"
                                    >
                                        <DownloadIcon className="size-3.5" />
                                        <span>Download</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilePreview;
