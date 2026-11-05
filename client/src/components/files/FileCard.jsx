import React, { useState } from 'react';
import { formatBytes, getFileIcon } from '../../assets/assets';
import { ItemDropdown } from '../ui/ItemDropdown';
import { format } from 'date-fns';
import { StarIcon } from 'lucide-react';
import { isItemStarredLocal } from '../../utils/starredStorage';

const FileCard = ({ file, onPreview, onShare, onRename, onMove, onDelete, onToggleStar }) => {
  const isStarred = isItemStarredLocal(file);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCardClick = (e) => {
    // 1. If dropdown menu is open, ignore clicks on card
    if (isMenuOpen) {
      return;
    }
    // 2. Ghost click shield: ignore delayed synthetic clicks from mobile touches on actions/dropdowns
    if (typeof window !== "undefined" && Date.now() - (window.__lastDropdownActionTime || 0) < 600) {
      return;
    }
    // 3. Ignore clicks if initiated from any interactive child (buttons, dropdowns, actions)
    if (e.target.closest('[data-card-action]') || e.target.closest('button')) {
      return;
    }
    onPreview?.(file);
  };

  return (
    <div 
      onClick={handleCardClick}
      data-dropdown-open={isMenuOpen ? "true" : undefined}
      className={`group relative ${isMenuOpen ? "z-30" : "z-0"} bg-white border border-slate-200
      hover:border-orange-200 rounded-2xl p-3.5 sm:p-4 transition-all duration-200
      cursor-pointer flex flex-col justify-between active:scale-[0.99] shadow-xs`}
    >
      <div className='flex items-start justify-between gap-2 mb-2.5 sm:mb-3'>
        <div className='p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0 pointer-events-none'>
          {getFileIcon(file.mime_type, "size-5 sm:size-6")}
        </div>
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
              onToggleStar?.(file);
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
            item={{ ...file, is_starred: isStarred }} 
            onPreview={onPreview} 
            onShare={onShare}
            onRename={onRename} 
            onMove={onMove} 
            onDelete={onDelete} 
            onToggleStar={onToggleStar}
            onOpenChange={setIsMenuOpen}
          />
        </div>
      </div>

      <div className="pointer-events-none">
        <h4 
          className='text-xs sm:text-sm font-medium text-slate-800 truncate group-hover:text-orange-700 transition-colors' 
          title={file.name}
        >
          {file.name}
        </h4>
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 mt-1">
          <span>{formatBytes(file.size)}</span>
          <span>{file.created_at ? format(new Date(file.created_at), "MMM d, yyyy") : ""}</span>
        </div>
      </div>
    </div>
  );
};

export default FileCard;
