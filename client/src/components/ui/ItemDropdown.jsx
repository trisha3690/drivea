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
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Item actions"
                    title="More options"
                >
                    <MoreVerticalIcon className="size-4" />
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
