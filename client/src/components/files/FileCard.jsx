import React from 'react';
import { formatBytes, getFileIcon } from '../../assets/assets';
import { ItemDropdown } from '../ui/ItemDropdown';
import { format } from 'date-fns';
import { StarIcon } from 'lucide-react';
import { isItemStarredLocal } from '../../utils/starredStorage';

const FileCard = ({ file, onPreview, onShare, onRename, onMove, onDelete, onToggleStar }) => {
  const isStarred = isItemStarredLocal(file);

  return (
    <div 
      onClick={() => onPreview?.(file)}
      className='group relative bg-white border border-slate-200
      hover:border-orange-200 rounded-2xl p-3.5 sm:p-4 transition-all duration-200
      cursor-pointer flex flex-col justify-between active:scale-[0.99] shadow-xs'
    >
      <div className='flex items-start justify-between gap-2 mb-2.5 sm:mb-3'>
        <div className='p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0'>
          {getFileIcon(file.mime_type, "size-5 sm:size-6")}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar?.(file);
            }}
            className={`p-1.5 rounded-lg transition ${
              isStarred
                ? "text-amber-500 hover:bg-amber-50"
                : "text-slate-300 hover:text-amber-500 hover:bg-slate-100 opacity-100 md:opacity-0 md:group-hover:opacity-100"
            }`}
            title={isStarred ? "Remove from Starred" : "Add to Starred"}
            aria-label={isStarred ? "Remove from Starred" : "Add to Starred"}
          >
            <StarIcon className={`size-4 ${isStarred ? "fill-amber-400 text-amber-500" : ""}`} />
          </button>
          <ItemDropdown 
            item={{ ...file, is_starred: isStarred }} 
            onPreview={onPreview} 
            onShare={onShare}
            onRename={onRename} 
            onMove={onMove} 
            onDelete={onDelete} 
            onToggleStar={onToggleStar}
          />
        </div>
      </div>

      <div>
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
