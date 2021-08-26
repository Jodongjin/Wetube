import mongoose from "mongoose";

mongoose.connect(process.env.DB_URL, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useFindAndModify: false, // findOneAndUpdate()에서 error 방지
    useCreateIndex: true, // DeprecationWarning 방지 (User.js -> unique: true)
}); // mongoose - mongodb 연결 (wetube: db_name)

const db = mongoose.connection; // db에 대한 connection에 access (서버와 db 서버 사이의 연결상태에 접근)

const handleOpen = () => console.log("Connected to DB");
const handleError = (error) => console.log("DB Error ", error);

db.on("error", handleError); // db에 error가 발생하면 event 발생 / === mongoose.connection.on()
db.once("open", handleOpen); // db가 정상적으로 열렸으면 event 발생 / connection이 열릴 때("open") 한 번만 발생