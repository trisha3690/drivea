import React, { useCallback, useEffect, useState } from 'react'
import api from '../../config/api';
import { toast } from 'react-hot-toast';
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
import { formatBytes, getFileIcon } from '../../assets/assets';

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
    const [blobUrl, setBlobUrl] = useState(null);
    const [directViewUrl, setDirectViewUrl] = useState(null);
    const [directDownloadUrl, setDirectDownloadUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState(null);
    const [mediaError, setMediaError] = useState(false);
    const [textContent, setTextContent] = useState(null);
    const [isCopied, setIsCopied] = useState(false);

    const fileType = detectFileType(file);

    // Build authenticated URL parameters
    const getAuthenticatedUrls = useCallback((fileId) => {
        const serverBase = api.defaults.baseURL || "";
        const token = localStorage.getItem("token");
        const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
        return {
            view: `${serverBase}/api/files/${fileId}/view${tokenParam}`,
            download: `${serverBase}/api/files/${fileId}/download${tokenParam}`,
        };
    }, []);

    // Load file content
    const loadFile = useCallback(async () => {
        if (!file?.id) {
            setError("File ID not provided.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setMediaError(false);

        const urls = getAuthenticatedUrls(file.id);
        setDirectViewUrl(urls.view);
        setDirectDownloadUrl(urls.download);

        try {
            if (fileType === "text") {
                // Fetch text content directly
                const res = await api.get(`/api/files/${file.id}/view`, { responseType: "text" });
                const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2);
                setTextContent(text.slice(0, 200000));
            } else if (fileType === "image" || fileType === "pdf") {
                // Fetch blob for seamless rendering without cross-origin cookie / referrer issues
                const res = await api.get(`/api/files/${file.id}/view`, { responseType: "blob" });
                const mime = file.mime_type || (fileType === "pdf" ? "application/pdf" : "image/jpeg");
                const blob = new Blob([res.data], { type: mime });
                const objectUrl = URL.createObjectURL(blob);
                setBlobUrl(objectUrl);
            } else if (fileType === "video" || fileType === "audio") {
                // For media, use authenticated streaming URL directly (supports byte range seeking)
                setBlobUrl(urls.view);
            }
        } catch (err) {
            console.error("Preview load error:", err);
            // If blob fetch fails, fallback to directViewUrl
            setBlobUrl(urls.view);
        } finally {
            setIsLoading(false);
        }
    }, [file, fileType, getAuthenticatedUrls]);

    useEffect(() => {
        loadFile();
        return () => {
            if (blobUrl && blobUrl.startsWith("blob:")) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [file]);

    // Download directly to user's local device
    const handleDownload = async () => {
        if (!file?.id) return;
        setIsDownloading(true);

        try {
            if (blobUrl && blobUrl.startsWith("blob:")) {
                // File already in memory, trigger instant download
                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = file.name;
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success("Download started");
                return;
            }

            // Fetch binary blob from server stream
            const response = await api.get(`/api/files/${file.id}/download`, {
                responseType: "blob",
            });
            const blob = new Blob([response.data], {
                type: file.mime_type || "application/octet-stream",
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            toast.success("Download started");
        } catch (err) {
            console.error("Download failed:", err);
            // Fallback: open direct authenticated download URL
            const fallbackUrl = directDownloadUrl || getAuthenticatedUrls(file.id).download;
            window.open(fallbackUrl, "_blank");
        } finally {
            setIsDownloading(false);
        }
    };

    // Open file in new tab
    const handleOpenInNewTab = () => {
        if (blobUrl && blobUrl.startsWith("blob:")) {
            window.open(blobUrl, "_blank");
        } else {
            const openUrl = directViewUrl || getAuthenticatedUrls(file.id).view;
            window.open(openUrl, "_blank");
        }
    };

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
                        <div className="shrink-0">
                            {getFileIcon(file.mime_type, "size-5 text-orange-600")}
                        </div>
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
                        {/* Open in Tab Button */}
                        <button
                          type="button"
                          onClick={handleOpenInNewTab}
                          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                          title="Open in new tab"
                        >
                            <ExternalLinkIcon className="size-3.5" />
                            <span className="hidden sm:inline">Open</span>
                        </button>

                        {/* Download to Device Button */}
                        <button
                          type="button"
                          onClick={handleDownload}
                          disabled={isDownloading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
                          title="Download to local device"
                        >
                            {isDownloading ? (
                                <Loader2Icon className="size-3.5 animate-spin" />
                            ) : (
                                <DownloadIcon className="size-3.5" />
                            )}
                            <span className="hidden sm:inline">
                                {isDownloading ? "Downloading..." : "Download"}
                            </span>
                        </button>

                        {/* Close Modal Button */}
                        <button 
                          type="button"
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
                                  onClick={loadFile}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                                >
                                    <RefreshCwIcon className="size-3.5" />
                                    <span>Retry</span>
                                </button>
                            </div>
                        </div>
                    ) : mediaError ? (
                        /* Graceful fallback if browser media element fails */
                        <div className="text-center p-6 bg-white border border-slate-200 rounded-2xl w-full max-w-md space-y-3 shadow-xs">
                            <FileTextIcon className="size-10 text-slate-400 mx-auto" />
                            <h4 className="text-sm font-semibold text-slate-900">Preview rendering issue</h4>
                            <p className="text-xs text-slate-500">
                                This file cannot be displayed directly inside the page, but you can download or open it.
                            </p>
                            <div className="pt-2 flex items-center justify-center gap-2">
                                <button 
                                  type="button"
                                  onClick={handleOpenInNewTab} 
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                                >
                                    <ExternalLinkIcon className="size-3.5" />
                                    <span>Open in tab</span>
                                </button>
                                <button 
                                  type="button"
                                  onClick={handleDownload} 
                                  disabled={isDownloading}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
                                >
                                    <DownloadIcon className="size-3.5" />
                                    <span>Download</span>
                                </button>
                            </div>
                        </div>
                    ) : fileType === "image" && (blobUrl || directViewUrl) ? (
                        <div className="flex items-center justify-center w-full h-full">
                            <img 
                              src={blobUrl || directViewUrl} 
                              alt={file.name} 
                              onError={() => setMediaError(true)}
                              className="max-h-[70vh] max-w-full object-contain rounded-xl border border-slate-200 shadow-sm"
                            />
                        </div>
                    ) : fileType === "video" && (blobUrl || directViewUrl) ? (
                        <div className="flex items-center justify-center w-full h-full">
                            <video 
                              src={blobUrl || directViewUrl} 
                              controls 
                              onError={() => setMediaError(true)}
                              className="max-h-[70vh] max-w-full rounded-xl border border-slate-200 shadow-sm"
                            />
                        </div>
                    ) : fileType === "audio" && (blobUrl || directViewUrl) ? (
                        <div className="p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-4 w-full max-w-md shadow-xs">
                            <p className="text-sm text-slate-800 font-semibold truncate max-w-full">{file.name}</p>
                            <audio 
                              src={blobUrl || directViewUrl} 
                              controls 
                              onError={() => setMediaError(true)}
                              className="w-full"
                            />
                        </div>
                    ) : fileType === "pdf" && (blobUrl || directViewUrl) ? (
                        <div className="w-full h-[70vh] flex flex-col rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                            <iframe 
                              src={blobUrl || directViewUrl} 
                              title={file.name} 
                              onError={() => setMediaError(true)}
                              className="w-full h-full"
                            />
                        </div>
                    ) : fileType === "text" ? (
                        textContent !== null ? (
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
                                <button 
                                  type="button"
                                  onClick={handleDownload}
                                  disabled={isDownloading}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
                                >
                                    <DownloadIcon className="size-3.5" />
                                    <span>Download File</span>
                                </button>
                            </div>
                        )
                    ) : (
                        /* Document / other file preview card */
                        <div className="text-center p-6 sm:p-10 bg-white border border-slate-200 rounded-2xl w-full max-w-md space-y-4 shadow-sm animate-fade-in">
                            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 w-fit mx-auto text-orange-600">
                                {getFileIcon(file.mime_type, "size-12")}
                            </div>
                            <div>
                                <h4 className="text-base font-semibold text-slate-900 break-words">{file.name}</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    {formatBytes(file.size)} • Document
                                </p>
                            </div>
                            <p className="text-xs text-slate-500 bg-slate-50 py-2 px-3 rounded-lg border border-slate-100">
                                This file can be downloaded to your local device or opened in a new tab.
                            </p>
                            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                                <button 
                                  type="button"
                                  onClick={handleDownload} 
                                  disabled={isDownloading}
                                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition shadow-xs"
                                >
                                    {isDownloading ? (
                                        <Loader2Icon className="size-4 animate-spin" />
                                    ) : (
                                        <DownloadIcon className="size-4" />
                                    )}
                                    <span>{isDownloading ? "Downloading..." : "Download to Device"}</span>
                                </button>
                                <button 
                                  type="button"
                                  onClick={handleOpenInNewTab} 
                                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                                >
                                    <ExternalLinkIcon className="size-4" />
                                    <span>Open in Tab</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilePreview;
