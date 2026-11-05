import React from "react";
import { MoreVerticalIcon, EyeIcon, Share2Icon, Edit2Icon, FolderInputIcon, Trash2Icon, StarIcon } from "lucide-react";
import { Dropdown, DropdownItem } from "./Dropdown";

export function ItemDropdown({ item, onPreview, onShare, onRename, onMove, onDelete, onToggleStar }) {
    return (
        <Dropdown
            align="right"
            className="w-48 shadow-lg"
            trigger={
                <button
                    type="button"
                    data-card-action="true"
                    className="p-2 sm:p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer touch-manipulation select-none"
                    aria-label="Item actions"
                    title="More options"
                >
                    <MoreVerticalIcon className="size-4 pointer-events-none" />
                </button>
            }
        >
            {onPreview && (
                <DropdownItem icon={EyeIcon} onClick={() => onPreview(item)}>
                    Preview
                </DropdownItem>
            )}
            {onToggleStar && (
                <DropdownItem icon={StarIcon} onClick={() => onToggleStar(item)}>
                    {item.is_starred ? "Remove from Starred" : "Add to Starred"}
                </DropdownItem>
            )}
            <DropdownItem icon={Share2Icon} onClick={() => onShare(item)}>
                Share Link
            </DropdownItem>
            <DropdownItem icon={Edit2Icon} onClick={() => onRename(item)}>
                Rename
            </DropdownItem>
            <DropdownItem icon={FolderInputIcon} onClick={() => onMove(item)}>
                Move to...
            </DropdownItem>
            <DropdownItem icon={Trash2Icon} danger onClick={() => onDelete(item)}>
                Delete
            </DropdownItem>
        </Dropdown>
    );
}
