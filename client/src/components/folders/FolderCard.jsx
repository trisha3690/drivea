import { LucideFolder, StarIcon } from 'lucide-react';
import React from 'react';
import { ItemDropdown } from '../ui/ItemDropdown';
import { isItemStarredLocal } from '../../utils/starredStorage';

const FolderCard = ({ folder, onClick, onShare, onRename, onMove, onDelete, onToggleStar }) => {
  const isStarred = isItemStarredLocal(folder);

  return (
    <div className="group relative bg-white border border-slate-200 hover:border-orange-200 rounded-2xl
    p-3.5 sm:p-4 transition-all duration-200 flex items-center justify-between gap-2 shadow-xs">
      <button
        type="button"
        onClick={() => onClick(folder)}
        className="flex-1 flex items-center gap-2.5 sm:gap-3 min-w-0 pr-1 text-left cursor-pointer"
      >
        <div className="p-2 sm:p-2.5 rounded-xl bg-orange-50 text-orange-600 shrink-0 border border-orange-100">
          <LucideFolder className="size-5 sm:size-6 fill-orange-500/20"/>
        </div>
        <h4 
          className="text-xs sm:text-sm font-medium text-slate-800 truncate group-hover:text-orange-600 transition-colors" 
          title={folder.name}
        >
          {folder.name}
        </h4>
      </button>

      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar?.(folder);
          }}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isStarred
              ? "text-amber-500 hover:bg-amber-50"
              : "text-slate-300 hover:text-amber-500 hover:bg-slate-100"
          }`}
          title={isStarred ? "Remove from Starred" : "Add to Starred"}
          aria-label={isStarred ? "Remove from Starred" : "Add to Starred"}
        >
          <StarIcon className={`size-4 ${isStarred ? "fill-amber-400 text-amber-500" : ""}`} />
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
