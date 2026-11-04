import express from "express"
import { accessShareLink, createShareLink, deleteShareLink, downloadSharedFile, getUserShareLinks, viewSharedFile } from "../controllers/shareController.js"
import { protect } from "../middleware/auth.js"

const shareRouter = express.Router()

// Public link access (anyone with the link)
shareRouter.get("/access/:token", accessShareLink)
shareRouter.get("/download/:token/:fileId?", downloadSharedFile)
shareRouter.get("/view/:token/:fileId?", viewSharedFile)

// Protected share management endpoints
shareRouter.use(protect)

shareRouter.post("/", createShareLink)
shareRouter.get("/", getUserShareLinks)
shareRouter.delete("/:id", deleteShareLink)

export default shareRouter
