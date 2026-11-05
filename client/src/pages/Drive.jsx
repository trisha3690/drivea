import React, { useEffect, useState } from 'react'
import Breadcrumbs from '../components/layout/Breadcrumbs'
import FileGrid from '../components/files/FileGrid'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useDrive } from '../hooks/useDrive'
import FilePreview from '../components/files/FilePreview'
import ShareModal from '../components/files/ShareModal'
import RenameModal from '../components/files/RenameModal'
import MoveModal from '../components/files/MoveModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

const Drive = () => {
  const navigate = useNavigate()
  const { folderId } = useParams()
  const { fetchDriveContent, setCurrentFolderId } = useApp()
  const { deleteItem: removeDriveItem, toggleStarItem } = useDrive()
 
  // Active item modals
  const [previewFile, setPreviewFile] = useState(null)
  const [shareItem, setShareItem] = useState(null)
  const [renameItem, setRenameItem] = useState(null)
  const [moveItem, setMoveItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)

  useEffect(() => {
    const id = folderId || null;
    setCurrentFolderId(id);
    fetchDriveContent(id);
  }, [folderId, fetchDriveContent, setCurrentFolderId]);

  const handleOpenPreview = (file) => {
    setShareItem(null);
    setRenameItem(null);
    setMoveItem(null);
    setDeleteItem(null);
    setPreviewFile(file);
  };

  const handleOpenShare = (item) => {
    setPreviewFile(null);
    setRenameItem(null);
    setMoveItem(null);
    setDeleteItem(null);
    setShareItem(item);
  };

  const handleOpenRename = (item) => {
    setPreviewFile(null);
    setShareItem(null);
    setMoveItem(null);
    setDeleteItem(null);
    setRenameItem(item);
  };

  const handleOpenMove = (item) => {
    setPreviewFile(null);
    setShareItem(null);
    setRenameItem(null);
    setDeleteItem(null);
    setMoveItem(item);
  };

  const handleOpenDelete = (item) => {
    setPreviewFile(null);
    setShareItem(null);
    setRenameItem(null);
    setMoveItem(null);
    setDeleteItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    await removeDriveItem(deleteItem);
    setDeleteItem(null);
  };

  return (
    <div className="space-y-4">
      {/* BreadCrumbs */}
      <Breadcrumbs />

      {/* folder & files */}
      <FileGrid 
        onFolderClick={(folder) => navigate(`/drive/${folder.id}`)}
        onPreviewFile={handleOpenPreview}
        onShareItem={handleOpenShare}
        onRenameItem={handleOpenRename}
        onMoveItem={handleOpenMove}
        onDeleteItem={handleOpenDelete}
        onToggleStarItem={toggleStarItem}
      />

      {/* Modals */}
      {previewFile && <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />}
      {shareItem && <ShareModal item={shareItem} isOpen={!!shareItem} onClose={() => setShareItem(null)} />}
      {renameItem && <RenameModal item={renameItem} isOpen={!!renameItem} onClose={() => setRenameItem(null)} />}
      {moveItem && <MoveModal item={moveItem} isOpen={!!moveItem} onClose={() => setMoveItem(null)} />}
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

export default Drive;
