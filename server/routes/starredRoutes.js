import express from "express";
import { protect } from "../middleware/auth.js";
import { getStarredItems } from "../controllers/starredController.js";

const starredRouter = express.Router();

starredRouter.use(protect);

starredRouter.get("/", getStarredItems);

export default starredRouter;

