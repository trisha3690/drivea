import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import api from "../config/api";

const isFolderItem = (item) => item?.item_type === "folder" || (!item?.mime_type && item?.path !== undefined)

export function useDrive(){
  const {fetchDriveContent, refreshUser, currentFolderId, isUploading, setIsUploading,
  uploadProgress,setUploadProgress} = useApp()

  // Reusable API action runner with standard toast & callback
  const runAction = async (apiCall, successMsg, errorMsg, afterSuccess) =>{
     try {
        const res = await apiCall;
        if (successMsg) toast.success(successMsg);
        if (afterSuccess) await afterSuccess(res?.data);
        return true;
     } catch (err) {
        toast.error(err.response?.data?.error || errorMsg);
        return false;
     }
  }

  // File Upload with real progress tracking and boundary-safe multipart form data
  const uploadFiles = async (fileList, folder_id = currentFolderId) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    if (folder_id && folder_id !== "null" && folder_id !== "root" && folder_id !== "undefined") {
      formData.append("folder_id", folder_id);
    }

    try {
      const { data } = await api.post("/api/files/upload", formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(Math.min(99, percent));
          }
        },
      });
      setUploadProgress(100);
      await new Promise((r) => setTimeout(r, 300));
      toast.success(`${data.files?.length || 1} file(s) uploaded successfully`);
      await fetchDriveContent(folder_id);
      await refreshUser();
    } catch (err) {
      console.error("Upload error:", err);
      const errorMessage =
        err.response?.data?.error ||
        (err.message === "Network Error"
          ? "Network error: check connection or file size"
          : "File upload failed");
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  //Create Folder

  const createFolder = (name, parent_id = currentFolderId)=> 
    runAction(
        api.post("/api/folders", {name, parent_id}), "Folder created", "Error creating folder",
        ()=> fetchDriveContent(parent_id)
    )

  //Polymorphic operations (accepts file or folder item / id)

  const renameItem = (item,newName)=>{
       const isFolder = isFolderItem(item);
       const endpoint = isFolder ? "folders" : "files";
       const id = item.id || item;
       return runAction(
        api.patch(`/api/${endpoint}/${id}/rename`, {name: newName}),
        `${isFolder ? "Folder" : "File"} renamed`,"Error renaming item", ()=> fetchDriveContent()
       )
  }

  const moveItem = (item, targetFolderId)=>{
     const isFolder = isFolderItem(item);
     const endpoint = isFolder ? "folders" : "files";
     const payload = isFolder ? {target_parent: targetFolderId} : {target_folder: targetFolderId};
     const id = item.id || item;
     return runAction(
        api.patch(`/api/${endpoint}/${id}/move`, payload),
        `${isFolder ? "Folder" : "File"} moved`,"Error moving item", ()=> fetchDriveContent()
       )
  }

  const deleteItem = (item)=>{
     const isFolder = isFolderItem(item);
     const endpoint = isFolder ? "folders" : "files";
     const id = item.id || item;
     return runAction(
        api.delete(`/api/${endpoint}/${id}`),
        `${isFolder ? "Folder" : "File"} moved to Trash`,"Error deleting item", ()=> fetchDriveContent()
       )
  }

  const restoreItem = (item)=>{
     const endpoint = isFolderItem(item) ? "folders" : "files";
     const id = item.id || item;
     return runAction(
        api.post(`/api/${endpoint}/${id}/restore`),
        "Item restored","Error restoring item"
       )
  }

  const permanentDeleteItem = (item)=>{
     const endpoint = isFolderItem(item) ? "folders" : "files";
     const id = item.id || item;
     return runAction(
        api.delete(`/api/${endpoint}/${id}/permanent`),
        "Item permanently deleted","Error deleting item", ()=> refreshUser()
       )
  }

  return {
    uploadFiles,
    createFolder,
    renameItem,
    moveItem,
    deleteItem,
    restoreItem,
    permanentDeleteItem,
    isUploading,
    uploadProgress
  }
}