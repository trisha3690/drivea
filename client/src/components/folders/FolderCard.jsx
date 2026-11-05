import { LucideFolder, StarIcon } from 'lucide-react';
import React from 'react';
import { ItemDropdown } from '../ui/ItemDropdown';
import { isItemStarredLocal } from '../../utils/starredStorage';

const FolderCard = ({ folder, onClick, onShare, onRename, onMove, onDelete, onToggleStar }) => {
  const isStarred = isItemStarredLocal(folder);

  const handleFolderClick = (e) => {
    if (typeof window !== "undefined" && Date.now() - (window.__lastDropdownActionTime || 0) < 650) {
      e?.stopPropagation();
      return;
    }
    if (e?.target?.closest('[data-card-action]')) {
      return;
    }
    onClick?.(folder);
  };

  return (
    <div className="group relative bg-white border border-slate-200 hover:border-orange-200 rounded-2xl
    p-3.5 sm:p-4 transition-all duration-200 flex items-center justify-between gap-2 shadow-xs">
      <button
        type="button"
        onClick={handleFolderClick}
        className="flex-1 flex items-center gap-2.5 sm:gap-3 min-w-0 pr-1 text-left cursor-pointer"
      >
        <div className="p-2 sm:p-2.5 rounded-xl bg-orange-50 text-orange-600 shrink-0 border border-orange-100 pointer-events-none">
          <LucideFolder className="size-5 sm:size-6 fill-orange-500/20"/>
        </div>
        <h4 
          className="text-xs sm:text-sm font-medium text-slate-800 truncate group-hover:text-orange-600 transition-colors pointer-events-none" 
          title={folder.name}
        >
          {folder.name}
        </h4>
      </button>

      <div 
        className="flex items-center gap-1" 
        data-card-action="true" 
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          data-card-action="true"
          onClick={(e) => {
            e.stopPropagation();
            if (typeof window !== "undefined") {
              window.__lastDropdownActionTime = Date.now();
            }
            onToggleStar?.(folder);
          }}
          className={`p-2 sm:p-1.5 rounded-lg transition-colors cursor-pointer touch-manipulation ${
            isStarred
              ? "text-amber-500 hover:bg-amber-50"
              : "text-slate-400 hover:text-amber-500 hover:bg-slate-100"
          }`}
          title={isStarred ? "Remove from Starred" : "Add to Starred"}
          aria-label={isStarred ? "Remove from Starred" : "Add to Starred"}
        >
          <StarIcon className={`size-4 pointer-events-none ${isStarred ? "fill-amber-400 text-amber-500" : ""}`} />
        </button>
        <ItemDropdown 
          item={{ ...folder, is_starred: isStarred }} 
          onShare={onShare} 
          onRename={onRename} 
          onMove={onMove} 
          onDelete={onDelete} 
          onToggleStar={onToggleStar}
        />
      </div>
    </div>
  );
};

export default FolderCard;
