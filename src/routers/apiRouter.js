import express from "express";
import { registerView, createComment, deleteComment } from "../controllers/videoController";

const aipRouter = express.Router();

aipRouter.post("/videos/:id([0-9a-f]{24})/view", registerView);
aipRouter.post("/videos/:id([0-9a-f]{24})/comment", createComment);
aipRouter.delete(`/:videoId([0-9a-f]{24})/comment/:commentId([0-9a-f]{24})/delete`, deleteComment);

export default aipRouter;