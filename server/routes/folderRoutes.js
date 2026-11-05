import express from "express";
import { protect } from "../middleware/auth.js";
import { createFolder, getFolderDetails, getFolders, moveFolder, permanentDeleteFolder, renameFolder, restoreFolder, softDeleteFolder, toggleStarFolder } from "../controllers/folderController.js";

const folderRouter = express.Router()

folderRouter.use(protect)

folderRouter.post("/", createFolder)
folderRouter.get("/", getFolders)
folderRouter.get("/:id", getFolderDetails)
folderRouter.patch("/:id/rename", renameFolder)
folderRouter.patch("/:id/move", moveFolder)
folderRouter.patch("/:id/star", toggleStarFolder)
folderRouter.delete("/:id", softDeleteFolder)
folderRouter.post("/:id/restore", restoreFolder)
folderRouter.delete("/:id/permanent", permanentDeleteFolder)

export default folderRouter