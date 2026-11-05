import toast from "react-hot-toast";
import { useApp } from "../context/AppContext";
import api from "../config/api";
import { getLocalStarredIds, isItemStarredLocal, toggleLocalStarredId } from "../utils/starredStorage";

const isFolderItem = (item) => item?.item_type === "folder" || (!item?.mime_type && item?.path !== undefined);

export function useDrive() {
  const {
    fetchDriveContent,
    refreshUser,
    currentFolderId,
    isUploading,
    setIsUploading,
    uploadProgress,
    setUploadProgress,
  } = useApp();

  // Reusable API action runner with standard toast & callback
  const runAction = async (apiCall, successMsg, errorMsg, afterSuccess) => {
    try {
      const res = await apiCall;
      if (successMsg) toast.success(successMsg);
      if (afterSuccess) await afterSuccess(res?.data);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || errorMsg);
      return false;
    }
  };

  // File Upload with real XHR progress and 100MB limit check
  const uploadFiles = async (fileList, folder_id = currentFolderId) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    // Client-side 100MB per file check
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
    const oversizedFile = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversizedFile) {
      const sizeMb = (oversizedFile.size / (1024 * 1024)).toFixed(1);
      toast.error(`"${oversizedFile.name}" (${sizeMb} MB) exceeds the 100 MB upload limit.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const baseURL = api.defaults.baseURL || "https://drivea-bjn0.onrender.com";

    try {
      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${baseURL}/api/files/upload`);
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }
        xhr.withCredentials = true;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded * 100) / event.total);
            setUploadProgress(Math.min(99, percent));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              resolve({ files: [] });
            }
          } else {
            try {
              const resData = JSON.parse(xhr.responseText);
              reject(new Error(resData.error || `Upload failed with status ${xhr.status}`));
            } catch {
              if (xhr.status === 413) {
                reject(new Error("File size exceeds the 100 MB limit."));
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error("Upload connection failed. Check your internet connection or try a smaller file."));
        };

        xhr.ontimeout = () => {
          reject(new Error("Upload timed out."));
        };

        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        if (folder_id && folder_id !== "null" && folder_id !== "root" && folder_id !== "undefined") {
          formData.append("folder_id", folder_id);
        }

        xhr.send(formData);
      });

      setUploadProgress(100);
      await new Promise((r) => setTimeout(r, 300));
      toast.success(`${data.files?.length || 1} file(s) uploaded successfully`);
      await fetchDriveContent(folder_id);
      await refreshUser();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.message || "File upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Create Folder
  const createFolder = (name, parent_id = currentFolderId) =>
    runAction(
      api.post("/api/folders", { name, parent_id }),
      "Folder created",
      "Error creating folder",
      () => fetchDriveContent(parent_id)
    );

  // Polymorphic operations (accepts file or folder item / id)
  const renameItem = (item, newName) => {
    const isFolder = isFolderItem(item);
    const endpoint = isFolder ? "folders" : "files";
    const id = item.id || item;
    return runAction(
      api.patch(`/api/${endpoint}/${id}/rename`, { name: newName }),
      `${isFolder ? "Folder" : "File"} renamed`,
      "Error renaming item",
      () => fetchDriveContent()
    );
  };

  const moveItem = (item, targetFolderId) => {
    const isFolder = isFolderItem(item);
    const endpoint = isFolder ? "folders" : "files";
    const payload = isFolder ? { target_parent: targetFolderId } : { target_folder: targetFolderId };
    const id = item.id || item;
    return runAction(
      api.patch(`/api/${endpoint}/${id}/move`, payload),
      `${isFolder ? "Folder" : "File"} moved`,
      "Error moving item",
      () => fetchDriveContent()
    );
  };

  const deleteItem = (item) => {
    const isFolder = isFolderItem(item);
    const endpoint = isFolder ? "folders" : "files";
    const id = item.id || item;
    return runAction(
      api.delete(`/api/${endpoint}/${id}`),
      `${isFolder ? "Folder" : "File"} moved to Trash`,
      "Error deleting item",
      () => fetchDriveContent()
    );
  };

  const restoreItem = (item) => {
    const endpoint = isFolderItem(item) ? "folders" : "files";
    const id = item.id || item;
    return runAction(
      api.post(`/api/${endpoint}/${id}/restore`),
      "Item restored",
      "Error restoring item"
    );
  };

  const permanentDeleteItem = (item) => {
    const endpoint = isFolderItem(item) ? "folders" : "files";
    const id = item.id || item;
    return runAction(
      api.delete(`/api/${endpoint}/${id}/permanent`),
      "Item permanently deleted",
      "Error deleting item",
      () => refreshUser()
    );
  };

  const toggleStarItem = async (item) => {
    const isFolder = isFolderItem(item);
    const endpoint = isFolder ? "folders" : "files";
    const id = item?.id || item;
    const currentlyStarred = isItemStarredLocal(item);
    const willBeStarred = !currentlyStarred;

    // Immediately update local storage and item property for instant feedback
    toggleLocalStarredId(id, willBeStarred);
    if (typeof item === "object" && item !== null) {
      item.is_starred = willBeStarred;
    }

    toast.success(willBeStarred ? "Added to Starred" : "Removed from Starred");
    fetchDriveContent();

    // Sync to backend API in background
    try {
      await api.patch(`/api/${endpoint}/${id}/star`);
    } catch (err) {
      console.warn("Backend star sync pending:", err.message);
    }
    return true;
  };

  return {
    uploadFiles,
    createFolder,
    renameItem,
    moveItem,
    deleteItem,
    restoreItem,
    permanentDeleteItem,
    toggleStarItem,
    isUploading,
    uploadProgress,
  };
}
