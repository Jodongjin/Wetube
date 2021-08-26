import express from "express";
import { logout, see, startGithubLogin, finishGithubLogin, getEdit, postEdit, getChangePassword, postChangePassword } from "../controllers/userController";
import { avatarUpload, protectorMiddleware, publicOnlyMiddleware } from "../middlewares";

const userRouter = express.Router();

userRouter.get("/logout", protectorMiddleware, logout);
userRouter.route("/edit").all(protectorMiddleware).get(getEdit).post(avatarUpload.single("avatar"), postEdit); // /users/edit x -> 중복됨 (users/users/edit)
userRouter.route("/change-password").all(protectorMiddleware).get(getChangePassword).post(postChangePassword);
userRouter.get("/github/start", publicOnlyMiddleware ,startGithubLogin);
userRouter.get("/github/finish", publicOnlyMiddleware ,finishGithubLogin); // 해당 URL은 깃허브에서 만들어 준 것 (callback URL)
userRouter.get("/:id", see);

export default userRouter;