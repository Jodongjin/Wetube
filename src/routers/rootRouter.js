import express from "express";
import { getJoin, postJoin, getLogin, postLogin } from "../controllers/userController"; // controller import -> controller의 원래 이름과 오브젝트로 받아야함
import { home, search } from "../controllers/videoController";
import { publicOnlyMiddleware } from "../middlewares";

const rootRouter = express.Router(); // router 생성

rootRouter.get("/", home); // router response
rootRouter.route("/join").all(publicOnlyMiddleware).get(getJoin).post(postJoin);
rootRouter.route("/login").all(publicOnlyMiddleware).get(getLogin).post(postLogin);
rootRouter.get("/search", search);

export default rootRouter;