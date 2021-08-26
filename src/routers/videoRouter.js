import express from "express";
import { watch, getEdit, postEdit, getUpload, postUpload, deleteVideo } from "../controllers/videoController";
import { protectorMiddleware, videoUpload } from "../middlewares";

const videoRouter = express.Router();

videoRouter.get("/:id([0-9a-f]{24})", watch);
videoRouter.route("/:id([0-9a-f]{24})/edit").all(protectorMiddleware).get(getEdit).post(postEdit);
videoRouter.route("/:id([0-9a-f]{24})/delete").all(protectorMiddleware).get(deleteVideo);
videoRouter
.route("/upload")
.all(protectorMiddleware)
.get(getUpload)
.post(videoUpload.fields([ // 파일 여러개 upload
    { name: "video", maxCount: 1 }, // input의 name 속성과 같은 값이어야함
    { name: "thumb", maxCount: 1 },
]), postUpload);

export default videoRouter;