import React from 'react'
import { useApp } from '../../context/AppContext'
import { Spinner } from '../ui/Spinner'
import { EmptyState } from '../ui/EmptyState'
import FolderCard from '../folders/FolderCard'
import FileCard from './FileCard'

const FileGrid = ({
  onFolderClick,
  onPreviewFile,
  onShareItem,
  onRenameItem,
  onMoveItem,
  onDeleteItem,
  onToggleStarItem,
  customFolders,
  customFiles,
  isLoading,
  emptyTitle,
  emptyDescription,
}) => {
    const appContext = useApp();
    const loadingState = isLoading !== undefined ? isLoading : appContext.isDriveLoading;
    const folderList = customFolders !== undefined ? customFolders : appContext.folders;
    const fileList = customFiles !== undefined ? customFiles : appContext.files;

    if (loadingState) {
        return (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Spinner size="lg" className="text-orange-600"/>
                <p className="text-sm font-semibold">Loading items...</p>
            </div>
        )
    }

    const hasFolders = folderList && folderList.length > 0;
    const hasFiles = fileList && fileList.length > 0;

    if (!hasFolders && !hasFiles) {
        return <EmptyState title={emptyTitle} description={emptyDescription} />
    }

    return (
        <div className="space-y-6">
            {/* Folders Section */}
            {hasFolders && (
                <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 sm:mb-3">
                      Folders
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {folderList.map((folder) => (
                         <FolderCard 
                           key={folder.id}
                           folder={folder}
                           onClick={onFolderClick}
                           onShare={(item) => onShareItem({...item, item_type: "folder"})}
                           onRename={(item) => onRenameItem({...item, item_type: "folder"})}
                           onMove={(item) => onMoveItem({...item, item_type: "folder"})}
                           onDelete={(item) => onDeleteItem({...item, item_type: "folder"})}
                           onToggleStar={(item) => onToggleStarItem?.({...item, item_type: "folder"})}
                         />
                      ))}
                    </div>
                </div>
            )}

            {/* Files Section */}
            {hasFiles && (
                <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 sm:mb-3">
                      Files
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {fileList.map((file) => (
                           <FileCard 
                             key={file.id}
                             file={file}
                             onPreview={onPreviewFile}
                             onShare={(item) => onShareItem({...item, item_type: "file"})}
                             onRename={(item) => onRenameItem({...item, item_type: "file"})}
                             onMove={(item) => onMoveItem({...item, item_type: "file"})}
                             onDelete={(item) => onDeleteItem({...item, item_type: "file"})}
                             onToggleStar={(item) => onToggleStarItem?.({...item, item_type: "file"})}
                           />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default FileGrid
