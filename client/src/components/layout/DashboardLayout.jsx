import React, { useRef, useState } from 'react'
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import CreateFolderModal from '../folders/CreateFolderModal';
import { useDrive } from '../../hooks/useDrive';
import { useApp } from '../../context/AppContext';
import { Dropdown, DropdownItem } from '../ui/Dropdown';
import { FolderPlusIcon, HardDriveUploadIcon, PlusIcon } from 'lucide-react';

const DashboardLayout = () => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const { uploadFiles, isUploading } = useDrive();
    const { currentFolderId } = useApp();
    const mobileFileInputRef = useRef(null);

    const handleMobileFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            uploadFiles(files, currentFolderId);
            setTimeout(() => {
                if (e.target) e.target.value = "";
            }, 500);
        }
    };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {/* Sidebar */}
        <Sidebar 
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen} 
          onCreateFolderClick={() => setIsCreateFolderOpen(true)}
        />

        {/* Main Content Workspace */}
        <div className="md:pl-64 flex flex-col flex-1 min-w-0">
           {/* Header */}
           <Header onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)} />

           <main className="flex-1 p-3.5 sm:p-4 md:p-6 overflow-y-auto">
            <Outlet />
           </main>
        </div>

        {/* Mobile Floating Action Button (FAB) */}
        <div className="fixed bottom-5 right-5 z-30 md:hidden">
            <input 
              type="file" 
              ref={mobileFileInputRef} 
              multiple 
              className="hidden" 
              onChange={handleMobileFileSelect} 
            />

            <Dropdown
              align="right"
              position="top"
              className="w-48 shadow-xl"
              trigger={
                <button
                  type="button"
                  disabled={isUploading}
                  className="size-13 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  aria-label="Add item"
                >
                  <PlusIcon className="size-6" />
                </button>
              }
            >
              <DropdownItem icon={HardDriveUploadIcon} onClick={() => mobileFileInputRef.current?.click()}>
                Upload Files
              </DropdownItem>
              <DropdownItem icon={FolderPlusIcon} onClick={() => setIsCreateFolderOpen(true)}>
                New Folder
              </DropdownItem>
            </Dropdown>
        </div>

        {/* Create Folder Modal */}
        <CreateFolderModal isOpen={isCreateFolderOpen} onClose={() => setIsCreateFolderOpen(false)} />
    </div>
  )
}

export default DashboardLayout
