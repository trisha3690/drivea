import React, { useCallback, useEffect, useRef, useState } from 'react'
import api from '../../config/api';
import { toast } from 'react-hot-toast';
import { 
  AlertCircleIcon, 
  CheckIcon, 
  CopyIcon, 
  DownloadIcon, 
  FileTextIcon, 
  Loader2Icon, 
  RefreshCwIcon, 
  XIcon,
  ZoomInIcon,
  ZoomOutIcon
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
  const docxExts = ["docx", "doc"];
  const pptxExts = ["pptx", "ppt", "ppsx", "pps", "odp"];
  const pptxMimes = [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
  ];

  if (docxExts.includes(ext) || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || mime === "application/msword") {
    return "docx";
  }
  if (pptxExts.includes(ext) || pptxMimes.includes(mime)) {
    return "pptx";
  }
  if (mime.startsWith("image/") || imageExts.includes(ext)) return "image";
  if (mime.startsWith("video/") || videoExts.includes(ext)) return "video";
  if (mime.startsWith("audio/") || audioExts.includes(ext)) return "audio";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.startsWith("text/") || mime === "application/json" || textExts.includes(ext)) return "text";
  return "other";
};

// Individual Page Renderer Component
const PdfPage = ({ pageNum, pdfDoc, scale }) => {
    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [pageError, setPageError] = useState(false);

    useEffect(() => {
        let active = true;
        if (!pdfDoc) return;

        const renderPage = async () => {
            try {
                setIsPageLoading(true);
                setPageError(false);

                if (renderTaskRef.current) {
                    try { renderTaskRef.current.cancel(); } catch (e) {}
                }

                const page = await pdfDoc.getPage(pageNum);
                if (!active || !canvasRef.current) return;

                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                const viewport = page.getViewport({ scale });

                canvas.width = Math.floor(viewport.width * dpr);
                canvas.height = Math.floor(viewport.height * dpr);
                canvas.style.width = `${Math.floor(viewport.width)}px`;
                canvas.style.height = `${Math.floor(viewport.height)}px`;

                ctx.save();
                ctx.scale(dpr, dpr);

                // Ensure solid white background on mobile
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, viewport.width, viewport.height);

                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport,
                };

                const task = page.render(renderContext);
                renderTaskRef.current = task;
                await task.promise;
                ctx.restore();

                if (active) setIsPageLoading(false);
            } catch (err) {
                if (err?.name !== 'RenderingCancelledException') {
                    console.warn(`Error rendering page ${pageNum}:`, err);
                    if (active) setPageError(true);
                }
            } finally {
                if (active) setIsPageLoading(false);
            }
        };

        renderPage();

        return () => {
            active = false;
            if (renderTaskRef.current) {
                try { renderTaskRef.current.cancel(); } catch (e) {}
            }
        };
    }, [pdfDoc, pageNum, scale]);

    return (
        <div className="flex flex-col items-center mb-6 max-w-full">
            <div className="relative shadow-sm rounded-lg border border-slate-200 bg-white max-w-full overflow-hidden">
                {isPageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                        <Loader2Icon className="size-6 animate-spin text-orange-600" />
                    </div>
                )}
                {pageError ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                        Failed to render page {pageNum}
                    </div>
                ) : null}
                <canvas ref={canvasRef} className="block max-w-full h-auto bg-white" />
            </div>
            <span className="text-[11px] font-medium text-slate-500 mt-2">
                Page {pageNum} of {pdfDoc.numPages}
            </span>
        </div>
    );
};

// Clean inline PDF renderer on white background with page zoom controls
const PdfRenderer = ({ buffer, directUrl, onMediaError }) => {
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 0.85 : 1.15));
    const [isLoading, setIsLoading] = useState(true);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [renderError, setRenderError] = useState(false);

    useEffect(() => {
        let active = true;
        setIsLoading(true);
        setRenderError(false);
        setNumPages(0);
        setPdfDoc(null);

        (async () => {
            try {
                const pdfjsLib = await import('pdfjs-dist');
                const pdfWorker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
                pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

                const input = buffer ? { data: new Uint8Array(buffer) } : { url: directUrl };
                const loadingTask = pdfjsLib.getDocument(input);
                const doc = await loadingTask.promise;
                if (!active) return;
                setPdfDoc(doc);
                setNumPages(doc.numPages);
            } catch (err) {
                console.error("PDF load error:", err);
                if (active) {
                    setRenderError(true);
                }
            } finally {
                if (active) setIsLoading(false);
            }
        })();

        return () => {
            active = false;
        };
    }, [buffer, directUrl]);

    if (renderError) {
        return (
            <div className="w-full h-[75vh] flex flex-col rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                <iframe 
                  src={directUrl} 
                  title="PDF Preview" 
                  onError={onMediaError}
                  className="w-full h-full bg-white"
                />
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col h-[75vh] bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm relative animate-fade-in">
            {/* Clean White PDF Controls Bar */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-white border-b border-slate-200 text-xs shrink-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700 text-xs">
                        {numPages > 0 ? `${numPages} Pages` : "Loading pages..."}
                    </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                    <button
                      type="button"
                      onClick={() => setScale(s => Math.max(0.5, Number((s - 0.15).toFixed(2))))}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 transition cursor-pointer"
                      title="Zoom out"
                    >
                        <ZoomOutIcon className="size-4" />
                    </button>
                    <span className="font-mono text-slate-600 px-1 text-[11px] min-w-9 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setScale(s => Math.min(2.5, Number((s + 0.15).toFixed(2))))}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 transition cursor-pointer"
                      title="Zoom in"
                    >
                        <ZoomInIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setScale(window.innerWidth < 640 ? 0.85 : 1.15)}
                      className="px-2 py-0.5 hover:bg-slate-100 rounded text-[11px] text-slate-600 font-medium transition ml-1 cursor-pointer"
                      title="Reset zoom"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Scrollable White Canvas Pages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-white flex flex-col items-center">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500 py-12">
                        <Loader2Icon className="size-8 animate-spin text-orange-600" />
                        <p className="text-sm font-medium">Loading PDF document...</p>
                    </div>
                ) : (
                    Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
                        <PdfPage 
                          key={pageNum} 
                          pageNum={pageNum} 
                          pdfDoc={pdfDoc} 
                          scale={scale} 
                        />
                    ))
                )}
            </div>
        </div>
    );
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
    const [docxHtml, setDocxHtml] = useState(null);
    const [pptxBuffer, setPptxBuffer] = useState(null);
    const [fallbackSlides, setFallbackSlides] = useState([]);
    const [isPptxRendering, setIsPptxRendering] = useState(false);
    const [pdfBuffer, setPdfBuffer] = useState(null);
    const [isCopied, setIsCopied] = useState(false);
    const docxContainerRef = useRef(null);
    const pptxContainerRef = useRef(null);
    const pptxViewerInstanceRef = useRef(null);

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
        setDocxHtml(null);
        setTextContent(null);
        setPptxBuffer(null);
        setPdfBuffer(null);
        setFallbackSlides([]);
        setIsPptxRendering(false);

        const urls = getAuthenticatedUrls(file.id);
        setDirectViewUrl(urls.view);
        setDirectDownloadUrl(urls.download);

        try {
            if (fileType === "docx") {
                // Fetch docx binary blob and convert directly to readable HTML
                const res = await api.get(`/api/files/${file.id}/view`, { responseType: "blob" });
                const mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                const blob = new Blob([res.data], { type: mime });
                const objectUrl = URL.createObjectURL(blob);
                setBlobUrl(objectUrl);

                try {
                    const mammoth = await import("mammoth");
                    const arrayBuffer = await res.data.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setDocxHtml(result.value || "<p><em>This document has no readable text.</em></p>");
                } catch (docxErr) {
                    console.warn("Mammoth failed, falling back to docx-preview:", docxErr);
                    try {
                        const { renderAsync } = await import("docx-preview");
                        if (docxContainerRef.current) {
                            docxContainerRef.current.innerHTML = "";
                            await renderAsync(res.data, docxContainerRef.current, null, {
                                className: "docx-preview-content",
                                inWrapper: false,
                                ignoreWidth: true,
                                ignoreHeight: true,
                            });
                        }
                    } catch (renderErr) {
                        console.error("Both docx preview methods failed:", renderErr);
                        setMediaError(true);
                    }
                }
            } else if (fileType === "pptx") {
                // Fetch pptx binary blob and store buffer for the dedicated renderer effect
                setIsPptxRendering(true);
                const res = await api.get(`/api/files/${file.id}/view`, { responseType: "blob" });
                const mime = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
                const blob = new Blob([res.data], { type: mime });
                const objectUrl = URL.createObjectURL(blob);
                setBlobUrl(objectUrl);

                const arrayBuffer = await res.data.arrayBuffer();
                setPptxBuffer(arrayBuffer);
            } else if (fileType === "text") {
                const res = await api.get(`/api/files/${file.id}/view`, { responseType: "text" });
                const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2);
                setTextContent(text.slice(0, 200000));
            } else if (fileType === "pdf") {
                const res = await api.get(`/api/files/${file.id}/view`, { responseType: "blob" });
                const blob = new Blob([res.data], { type: "application/pdf" });
                const objectUrl = URL.createObjectURL(blob);
                setBlobUrl(objectUrl);
                const arrayBuffer = await res.data.arrayBuffer();
                setPdfBuffer(arrayBuffer);
            } else if (fileType === "image") {
                const res = await api.get(`/api/files/${file.id}/view`, { responseType: "blob" });
                const blob = new Blob([res.data], { type: file.mime_type || "image/jpeg" });
                const objectUrl = URL.createObjectURL(blob);
                setBlobUrl(objectUrl);
            } else if (fileType === "video" || fileType === "audio") {
                setBlobUrl(urls.view);
            }
        } catch (err) {
            console.error("Preview load error:", err);
            setBlobUrl(urls.view);
        } finally {
            setIsLoading(false);
        }
    }, [file, fileType, getAuthenticatedUrls]);

    // Dedicated effect to render PPTX once the container DOM element is guaranteed to be mounted
    useEffect(() => {
        if (!pptxBuffer || !pptxContainerRef.current) return;
        let active = true;
        setIsPptxRendering(true);

        (async () => {
            try {
                const { PptxViewer, RECOMMENDED_ZIP_LIMITS } = await import("@aiden0z/pptx-renderer");
                if (!active || !pptxContainerRef.current) return;
                pptxContainerRef.current.innerHTML = "";
                const viewer = await PptxViewer.open(pptxBuffer, pptxContainerRef.current, {
                    zipLimits: RECOMMENDED_ZIP_LIMITS,
                });
                if (active) {
                    pptxViewerInstanceRef.current = viewer;
                } else {
                    viewer?.destroy?.();
                }
            } catch (err) {
                console.warn("PptxViewer visual render failed, trying slide text extraction:", err);
                if (!active) return;
                try {
                    const JSZipModule = await import("jszip");
                    const JSZip = JSZipModule.default || JSZipModule;
                    const zip = await JSZip.loadAsync(pptxBuffer);
                    const slideNames = Object.keys(zip.files)
                        .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
                        .sort((a, b) => {
                            const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
                            const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
                            return numA - numB;
                        });

                    const slides = [];
                    for (const sName of slideNames) {
                        const xml = await zip.files[sName].async("text");
                        const matches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
                        const lines = matches.map(m => m.replace(/<[^>]+>/g, "").trim()).filter(Boolean);
                        if (lines.length > 0) {
                            slides.push({
                                number: slides.length + 1,
                                title: lines[0],
                                points: lines.slice(1),
                            });
                        }
                    }
                    if (slides.length > 0) {
                        setFallbackSlides(slides);
                    } else {
                        setMediaError(true);
                    }
                } catch (fallbackErr) {
                    console.error("PPTX fallback extraction failed:", fallbackErr);
                    setMediaError(true);
                }
            } finally {
                if (active) setIsPptxRendering(false);
            }
        })();

        return () => {
            active = false;
            if (pptxViewerInstanceRef.current?.destroy) {
                try {
                    pptxViewerInstanceRef.current.destroy();
                } catch (e) {
                    // ignore
                }
                pptxViewerInstanceRef.current = null;
            }
        };
    }, [pptxBuffer]);

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
            const fallbackUrl = directDownloadUrl || getAuthenticatedUrls(file.id).download;
            window.open(fallbackUrl, "_blank");
        } finally {
            setIsDownloading(false);
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
                        {/* Single Consistent Download Button */}
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
                <div className="flex-1 p-3 sm:p-6 overflow-auto flex items-center justify-center bg-white min-h-60 sm:min-h-96">
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
                                This file cannot be displayed directly inside the page, but you can download it to your local device.
                            </p>
                            <div className="pt-2 flex items-center justify-center gap-2">
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
                    ) : fileType === "docx" ? (
                        /* Direct Word Document Inline Preview */
                        docxHtml ? (
                            <div className="w-full flex flex-col h-[75vh] bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm animate-fade-in">
                                <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                                    <div 
                                      className="max-w-3xl mx-auto bg-white p-6 sm:p-12 rounded-xl shadow-xs border border-slate-200 document-preview-body"
                                      dangerouslySetInnerHTML={{ __html: docxHtml }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div ref={docxContainerRef} className="w-full max-h-[75vh] overflow-y-auto bg-white rounded-xl p-6 border border-slate-200" />
                        )
                    ) : fileType === "pptx" ? (
                        /* Direct PowerPoint Presentation Inline Preview */
                        <div className="w-full flex flex-col h-[75vh] bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm relative animate-fade-in">
                            {isPptxRendering && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-slate-600 bg-white/90 backdrop-blur-xs">
                                    <Loader2Icon className="size-8 animate-spin text-orange-600"/>
                                    <p className="text-sm font-medium">Loading presentation slides...</p>
                                </div>
                            )}
                            {fallbackSlides.length > 0 ? (
                                <div className="w-full h-full overflow-y-auto p-4 sm:p-8 space-y-6 bg-white">
                                    {fallbackSlides.map(slide => (
                                        <div key={slide.number} className="max-w-2xl mx-auto bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-8">
                                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">Slide {slide.number}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-4">{slide.title}</h3>
                                            <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
                                                {slide.points.map((pt, idx) => (
                                                    <li key={idx} className="leading-relaxed">{pt}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div 
                                  ref={pptxContainerRef} 
                                  className="w-full h-full overflow-auto p-4 pptx-preview-container bg-white" 
                                />
                            )}
                        </div>
                    ) : fileType === "image" && (blobUrl || directViewUrl) ? (
                        <div className="flex items-center justify-center w-full h-full">
                            <img 
                              src={blobUrl || directViewUrl} 
                              alt={file.name} 
                              onError={() => setMediaError(true)}
                              className="max-h-[70vh] max-w-full object-contain rounded-xl border border-slate-200 shadow-sm bg-white"
                            />
                        </div>
                    ) : fileType === "video" && (blobUrl || directViewUrl) ? (
                        <div className="flex items-center justify-center w-full h-full">
                            <video 
                              src={blobUrl || directViewUrl} 
                              controls 
                              onError={() => setMediaError(true)}
                              className="max-h-[70vh] max-w-full rounded-xl border border-slate-200 shadow-sm bg-white"
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
                        <PdfRenderer 
                          buffer={pdfBuffer} 
                          directUrl={blobUrl || directViewUrl} 
                          onMediaError={() => setMediaError(true)} 
                        />
                    ) : fileType === "text" ? (
                        textContent !== null ? (
                            <div className="w-full flex flex-col max-h-[70vh] bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 text-slate-700 text-xs border-b border-slate-200">
                                    <span className="font-mono font-medium truncate">{file.name}</span>
                                    <button
                                      type="button"
                                      onClick={handleCopyText}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] text-slate-700 font-medium transition"
                                    >
                                        {isCopied ? <CheckIcon className="size-3.5 text-emerald-600" /> : <CopyIcon className="size-3.5" />}
                                        <span>{isCopied ? "Copied" : "Copy"}</span>
                                    </button>
                                </div>
                                <pre className="p-4 sm:p-6 text-xs font-mono text-slate-800 bg-white overflow-auto whitespace-pre-wrap break-all leading-relaxed flex-1">
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
                                    <span>Download</span>
                                </button>
                            </div>
                        )
                    ) : (
                        /* Unsupported binary files (archives, executables, etc.) */
                        <div className="text-center p-6 sm:p-10 bg-white border border-slate-200 rounded-2xl w-full max-w-md space-y-4 shadow-sm animate-fade-in">
                            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 w-fit mx-auto text-orange-600">
                                {getFileIcon(file.mime_type, "size-12")}
                            </div>
                            <div>
                                <h4 className="text-base font-semibold text-slate-900 break-words">{file.name}</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    {formatBytes(file.size)} • File
                                </p>
                            </div>
                            <p className="text-xs text-slate-600 bg-white py-2 px-3 rounded-lg border border-slate-200">
                                This file can be downloaded directly to your local device.
                            </p>
                            <div className="pt-2 flex items-center justify-center">
                                <button 
                                  type="button"
                                  onClick={handleDownload} 
                                  disabled={isDownloading}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition shadow-xs"
                                >
                                    {isDownloading ? (
                                        <Loader2Icon className="size-4 animate-spin" />
                                    ) : (
                                        <DownloadIcon className="size-4" />
                                    )}
                                    <span>{isDownloading ? "Downloading..." : "Download"}</span>
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
