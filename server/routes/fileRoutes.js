import express from "express"
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js"
import { downloadFile, getFilePreviewUrl, getFiles, moveFile, permanentDeleteFile, renameFile, restoreFile, softDeleteFile, toggleStarFile, uploadFiles, viewFile } from "../controllers/fileController.js";

const fileRouter = express.Router();

// All file routes require authentication
fileRouter.use(protect)

fileRouter.post("/upload", (req, res, next) => {
    upload.array("files", 10)(req, res, (err) => {
        if (err) {
            console.error("[Multer Upload Error]:", err);
            const message = err.code === "LIMIT_FILE_SIZE" 
                ? "File size exceeds the 100 MB limit."
                : (err.message || "File upload processing failed.");
            return res.status(400).json({ error: message });
        }
        next();
    });
}, uploadFiles)
fileRouter.get("/", getFiles)
fileRouter.get("/:id/preview", getFilePreviewUrl)
fileRouter.get("/:id/download", downloadFile)
fileRouter.get("/:id/view", viewFile)
fileRouter.patch("/:id/rename", renameFile)
fileRouter.patch("/:id/move", moveFile)
fileRouter.patch("/:id/star", toggleStarFile)
fileRouter.delete("/:id", softDeleteFile)
fileRouter.post("/:id/restore", restoreFile)
fileRouter.delete("/:id/permanent", permanentDeleteFile)

export default fileRouter;