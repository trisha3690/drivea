import express from "express"
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js"
import { downloadFile, getFilePreviewUrl, getFiles, moveFile, permanentDeleteFile, renameFile, restoreFile, softDeleteFile, uploadFiles, viewFile } from "../controllers/fileController.js";

const fileRouter = express.Router();

// All file routes require authentication
fileRouter.use(protect)

fileRouter.post("/upload",upload.array("files",10), uploadFiles)
fileRouter.get("/", getFiles)
fileRouter.get("/:id/preview", getFilePreviewUrl)
fileRouter.get("/:id/download", downloadFile)
fileRouter.get("/:id/view", viewFile)
fileRouter.patch("/:id/rename", renameFile)
fileRouter.patch("/:id/move", moveFile)
fileRouter.delete("/:id", softDeleteFile)
fileRouter.post("/:id/restore", restoreFile)
fileRouter.delete("/:id/permanent", permanentDeleteFile)

export default fileRouter;