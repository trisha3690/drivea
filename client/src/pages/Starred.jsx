import React, { useEffect, useState, useCallback } from 'react';
import { StarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useDrive } from '../hooks/useDrive';
import FileGrid from '../components/files/FileGrid';
import FilePreview from '../components/files/FilePreview';
import ShareModal from '../components/files/ShareModal';
import RenameModal from '../components/files/RenameModal';
import MoveModal from '../components/files/MoveModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { getLocalStarredIds } from '../utils/starredStorage';

const Starred = () => {
  const navigate = useNavigate();
  const [{ folders, files }, setStarredItems] = useState({ folders: [], files: [] });
  const [isLoading, setIsLoading] = useState(true);

  const { deleteItem: removeDriveItem, toggleStarItem } = useDrive();

  // Active item modals
  const [previewFile, setPreviewFile] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [renameItem, setRenameItem] = useState(null);
  const [moveItem, setMoveItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const fetchStarred = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/api/starred');
      if (data && (Array.isArray(data.folders) || Array.isArray(data.files))) {
        setStarredItems({
          folders: data.folders || [],
          files: data.files || [],
        });
        return;
      }
    } catch {
      // Backend /api/starred route may still be deploying on Render; use resilient fallback
    }

    // Resilient fallback: fetch all drive items and filter by starred IDs
    try {
      const starredIds = new Set(getLocalStarredIds());
      const [folderRes, fileRes] = await Promise.all([
        api.get("/api/folders"),
        api.get("/api/files")
      ]);

      const allFolders = (folderRes.data?.folders || []).map((f) => ({
        ...f,
        item_type: "folder",
        is_starred: !!f.is_starred || starredIds.has(f.id)
      }));

      const allFiles = (fileRes.data?.files || []).map((f) => ({
        ...f,
        item_type: "file",
        is_starred: !!f.is_starred || starredIds.has(f.id)
      }));

      setStarredItems({
        folders: allFolders.filter((f) => f.is_starred),
        files: allFiles.filter((f) => f.is_starred)
      });
    } catch (fallbackErr) {
      console.warn("Could not load starred fallback:", fallbackErr.message);
      toast.error('Error loading starred items');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStarred();
  }, [fetchStarred]);

  const handleToggleStar = async (item) => {
    // Optimistic UI update: immediately remove from Starred view
    const isFolder = item.item_type === 'folder' || (!item.mime_type && item.path !== undefined);
    setStarredItems((prev) => ({
      folders: isFolder ? prev.folders.filter((f) => f.id !== item.id) : prev.folders,
      files: isFolder ? prev.files : prev.files.filter((f) => f.id !== item.id),
    }));

    await toggleStarItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    const isFolder = deleteItem.item_type === 'folder' || (!deleteItem.mime_type && deleteItem.path !== undefined);
    const ok = await removeDriveItem(deleteItem);
    if (ok) {
      setStarredItems((prev) => ({
        folders: isFolder ? prev.folders.filter((f) => f.id !== deleteItem.id) : prev.folders,
        files: isFolder ? prev.files : prev.files.filter((f) => f.id !== deleteItem.id),
      }));
    }
    setDeleteItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500 border border-amber-200 shrink-0">
          <StarIcon className="size-5 fill-amber-400" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-medium text-slate-900">Starred</h2>
          <p className="text-xs text-slate-500">Quick access to your favorite files and folders</p>
        </div>
      </div>

      {/* Grid of Starred Items */}
      <FileGrid
        customFolders={folders}
        customFiles={files}
        isLoading={isLoading}
        emptyTitle="No starred items"
        emptyDescription="Star important files and folders to easily find them here later."
        onFolderClick={(folder) => navigate(`/drive/${folder.id}`)}
        onPreviewFile={setPreviewFile}
        onShareItem={setShareItem}
        onRenameItem={setRenameItem}
        onMoveItem={setMoveItem}
        onDeleteItem={setDeleteItem}
        onToggleStarItem={handleToggleStar}
      />

      {/* Modals */}
      {previewFile && <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />}
      {shareItem && <ShareModal item={shareItem} isOpen={!!shareItem} onClose={() => setShareItem(null)} />}
      {renameItem && <RenameModal item={renameItem} isOpen={!!renameItem} onClose={() => { setRenameItem(null); fetchStarred(); }} />}
      {moveItem && <MoveModal item={moveItem} isOpen={!!moveItem} onClose={() => { setMoveItem(null); fetchStarred(); }} />}
      {deleteItem && (
        <ConfirmDialog
          isOpen={!!deleteItem}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleConfirmDelete}
          title={`Move "${deleteItem.name}" to Trash?`}
          message="You can restore this item from Trash at any time"
          confirmText="Move to Trash"
        />
      )}
    </div>
  );
};

export default Starred;
