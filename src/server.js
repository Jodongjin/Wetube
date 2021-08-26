import express from "express"; // "express" package를 express라는 이름으로 node_modules로부터 import
import morgan from "morgan"; // -> package
import session from "express-session"; // session
import flash from "express-flash";
import MongoStore from "connect-mongo";
import rootRouter from "./routers/rootRouter"; // -> path
import videoRouter from "./routers/videoRouter";
import userRouter from "./routers/userRouter";
import aipRouter from "./routers/apiRouter";
import { localsMiddleware } from "./middlewares";

const app = express(); // express application 생성
const logger = morgan("dev"); // morgan 함수를 통한 middleware 생성

app.set("view engine", "pug"); // view engine으로 pug를 사용, app.set() 함수의 view 설정의 경우 현재 작업중인 디렉터리의 /views 폴더에서 view를 찾는 것이 default
app.set("views", process.cwd() + "/src/views");

// middlewares
app.use(logger); // 모든 페이지에 logger middleware 적용 / middleware 설정이 router 설정보다 항상 위에 와야함 -> session object에 접근 가능
app.use(express.urlencoded({ extended: true })); // javascript로 변형하여 사용해야하므로 router 설정 위에 와야함
app.use(express.json()); // commentSection.js에서 보내는 JSON.stringify를 JS object화
app.use( // session middleware, 세션을 생성하고 브라우저에 쿠키 전달 / session을 사용하는 middleware 보다 위에 있어야함
    session({
        secret: process.env.COOKIE_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
    })
);
app.use(flash());
app.use(localsMiddleware);
app.use((req, res, netx) => { // ffmpeg 관련 error
    res.header("Cross-Origin-Embedder-Policy", "require-corp");
    res.header("Cross-Origin-Opener-Policy", "same-origin");
    netx();
});

// static files serving (브라우저에 서버 폴더 노출)
app.use("/uploads", express.static("uploads"));
app.use("/static", express.static("assets")); // /static에 접근하면 assets folder 노출

// routers
app.use("/", rootRouter); // router 설정 / URL의 시작점에 따른 router 분류, 시작점을 알려줄 뿐 URL 자체를 제공하는 건 아님
app.use("/users", userRouter);
app.use("/videos", videoRouter);
app.use("/api", aipRouter);

export default app; // application을 configure하고 export