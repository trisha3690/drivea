import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../config/api'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { DownloadIcon, LockIcon, LucideFolder } from 'lucide-react'
import { formatBytes, getFileIcon } from '../assets/assets'
import toast from 'react-hot-toast'

const SharedWithMe = () => {
  const { token } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  const handleDownload = async (fileId, fileName) => {
    const downloadTargetId = fileId || "main";
    try {
      setDownloadingId(downloadTargetId);
      const targetName = fileName || data?.file?.name || "downloaded-file";
      const targetFileId = fileId || data?.file?.id;
      const shareEndpoint = fileId ? `/api/shares/download/${token}/${fileId}` : `/api/shares/download/${token}`;

      let response;
      try {
        // Try public share download endpoint first
        response = await api.get(shareEndpoint, {
          responseType: "blob",
          timeout: 60000,
        });
      } catch (shareErr) {
        // If public share endpoint is syncing or not yet active on Render, fallback to file download endpoint
        if (targetFileId && (shareErr.response?.status === 404 || shareErr.response?.status === 401)) {
          response = await api.get(`/api/files/${targetFileId}/download`, {
            responseType: "blob",
            timeout: 60000,
          });
        } else {
          throw shareErr;
        }
      }

      const blobType = response.headers["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: blobType });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = targetName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
      toast.success("Download started!");
    } catch (err) {
      console.error("[Shared download error]:", err);
      const status = err.response?.status;
      if (status === 401) {
        toast.error("Server is updating. In Render dashboard, click 'Manual Deploy' > 'Deploy latest commit'.");
      } else if (status === 404) {
        toast.error("Download route syncing. In Render dashboard, click 'Manual Deploy' > 'Deploy latest commit'.");
      } else if (status === 410) {
        toast.error("This share link has expired.");
      } else {
        toast.error(err.response?.data?.error || "Unable to download file. Please check your connection.");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    api.get(`/api/shares/access/${token}`)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Unable to load shared item");
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Minimal Header */}
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3">
          <img src="/logo.svg" alt="logo" className="size-6 sm:size-7" />
          <span className="text-xl sm:text-2xl font-medium text-slate-900">Drivea</span>
        </Link>
        <Link to="/login" className="text-xs font-semibold text-orange-600 hover:underline">
          Sign In
        </Link>
      </header>

      {/* Content Container */}
      <main className="flex-1 flex items-center justify-center p-3.5 sm:p-6">
        {isLoading ? (
          <div className="text-center space-y-3 py-12">
            <Spinner size="lg" className="text-orange-600" />
            <p className="text-sm text-slate-500 font-medium">Loading shared item...</p>
          </div>
        ) : error ? (
          <div className="max-w-md w-full p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4 shadow-sm">
            <div className="size-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
              <LockIcon className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Link Unavailable</h3>
            <p className="text-sm text-slate-500">{error}</p>
            <div className="pt-2">
              <Link to="/">
                <Button variant="secondary" size="sm">Go to Homepage</Button>
              </Link>
            </div>
          </div>
        ) : data?.resource_type === "file" ? (
          <div className="max-w-xl w-full p-5 sm:p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-5 sm:space-y-6 animate-fade-in shadow-sm">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
              {getFileIcon(data.file.mime_type, "size-8 sm:size-10")}
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-medium text-slate-900 mb-1 truncate px-2">{data.file.name}</h2>
              <p className="text-xs text-slate-500">
                Size: {formatBytes(data.file.size)} • Shared by {data.owner?.name || "User"}
              </p>
            </div>

            {data.permission === "download" ? (
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
                This link grants <span className="text-orange-600 font-semibold">download-only</span> permission.
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => handleDownload(null, data.file.name)}
              disabled={downloadingId === "main"}
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition shadow-xs"
            >
              <DownloadIcon className="size-4" />
              <span>{downloadingId === "main" ? "Downloading..." : "Download File"}</span>
            </button>
          </div>
        ) : (
          // Folder View
          <div className="max-w-2xl w-full p-5 sm:p-8 bg-white border border-slate-200 rounded-3xl space-y-5 sm:space-y-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 shrink-0">
                <LucideFolder className="size-5 sm:size-6 fill-orange-500/20" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">{data.folder.name}</h2>
                <p className="text-xs text-slate-500">Shared Folder by {data.owner?.name || "User"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contents</h3>

              {!data.files || data.files.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium">
                  This folder is empty.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 bg-slate-50/50 border border-slate-200 rounded-xl overflow-hidden">
                  {data.files.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-2 hover:bg-slate-100/80 transition"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-1 sm:pr-3">
                        {getFileIcon(f.mime_type, "size-5 shrink-0")}
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{f.name}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500">{formatBytes(f.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(f.id, f.name)}
                        disabled={downloadingId === f.id}
                        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition shrink-0"
                      >
                        <DownloadIcon className="size-3.5" />
                        <span className="hidden sm:inline">{downloadingId === f.id ? "Downloading..." : "Download"}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SharedWithMe;
