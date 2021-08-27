import multer from "multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";

const s3 = new aws.S3({
    credentials: {
        accessKeyId: process.env.AWS_ID,
        secretAccessKey: process.env.AWS_SECRET
    }
});

const multerUploader = multerS3({
    s3: s3,
    bucket: "wetubedongjin", // aws에서 설정한 bucket name
    acl: "public-read",
});

export const localsMiddleware = (req, res, next) => {
    res.locals.siteName = "Wetube";
    res.locals.loggedIn = Boolean(req.session.loggedIn); // 브라우저에 해당되는 세션의 login 상태를 locals의 loggedIn 변수와 일치시켜줌 (undefiend 일 수 있어서 형변환)
    res.locals.loggedInUser = req.session.user || {}; // user 정보를 locals에 저장 / {} -> template에서 유저정보를 불러올 수  없다는 에러 방지
    next();
};


// server.js에서 app.use()에 넣지 않은 middleware는 모든 URL에 적용되지 x
export const protectorMiddleware = (req, res, next) => { // 유저가 로그인 상태일 때, 접근 계속
    if(req.session.loggedIn) {
        return next();
    } else {
        req.flash("error", "Log in first.");
        return res.redirect("/login");
    }
};

export const publicOnlyMiddleware = (req, res, next) => { // 유저가 로그아웃 상태일 때, 접근 계속
    if(!req.session.loggedIn) {
        return next();
    } else {
        req.flash("error", "Not authorized.");
        return res.redirect("/");
    }
};

// multers
export const avatarUpload = multer({
    dest: "uploads/avatars/",
    limits: {
        fileSize: 3000000,
    },
    storage: multerUploader,
});
export const videoUpload = multer({
    dest: "uploads/videos/",
    limits: {
        fileSize: 10000000,
    },
    storage: multerUploader,
});