import Video from "../models/Video";
import Comment from "../models/Comment";
import User from "../models/User";

export const home = async(req, res) => {
    const videos = await Video.find({}).sort({ createdAt: "desc" }).populate("owner"); // db에 저장된 모든 형태{}의 data return / error 발생 시 catch 블럭 실행
    return res.render("home", { pageTitle: "Home", videos }); // view를 return 할 때는 res.render() 사용 / home.pug를 rendering 하여 return
 }; // Home.pug가 extends하는 Base_pugFile에 있는 pageTitle 변수에 값을 전달

export const watch = async(req, res) => {
    const { id } = req.params; // URL의 :id 값을 가져옴 / const id = req.params와 같은 문법 { id } -> ES6
    const video = await Video.findById(id).populate("owner").populate("comments"); // video id에 해당되는 video의 owner 속성에 있는 user id를 기반으로 User db에서 user object를 가져옴
    if(!video) {
        return res.status(404).render("404", { pageTitle: "Video not found." });
    }
    const video2 = await Video.findById(id);
    res.render("watch", { pageTitle: video.title, video });
 };

export const getEdit = async(req, res) => {
    const { id } = req.params;
    const { user: { _id }, } = req.session;
    const video = await Video.findById(id);
    if(!video) {
        return res.status(404).render("404", { pageTitle: "Video not found." });
    }
    if(String(video.owner) !== _id) { // 비디오의 수정에 접근한 session의 user id가 video의 owner와 다르다면 수정 불가
        req.flash("error", "You are not the owner of the video.");
        return res.status(403).redirect("/");
    }
    return res.render("edit", { pageTitle: `Edit ${video.title}`, video });
};

export const postEdit = async(req, res) => {
    const { user: { _id }, } = req.session;
    const { id } = req.params;
    const { title, description, hashtags } = req.body;
    const video = await Video.exists({ _id: id }); // 존재하는지만 알면 됨 (data 불러올 필요까지는 x)
    if(!video) {
        return res.status(404).render("404", { pageTitle: "Video not found." });
    }
    if(String(video.owner) !== _id) { // 비디오의 수정에 접근한 session의 user id가 video의 owner와 다르다면 수정 불가
        return res.status(403).redirect("/");
    }
    await Video.findByIdAndUpdate(id, {
        title,
        description,
        hashtahs: Video.formatHashtags(hashtags),
    });
    req.flash("success", "Changes saved.");
    return res.redirect(`/videos/${id}`); // 전달한 URL로 이동
};

export const getUpload = (req, res) => {
    return res.render("upload", { pageTitle: "Upload Video" });
};

export const postUpload = async(req, res) => {
    const { user: { _id } } = req.session; // req.session.user._id
    const { video, thumb } = req.files; // video upload에서는 input이 필수요소이기 때문에 req.file object가 무조건 있음 / path를 받아서 fileUrl로 이름변경
    const { title, description, hashtags } = req.body; // upload.pug의 form으로부터 input value를 가져옴
    try{
        const newVideo = await Video.create({ // db에 넣어줄 document 생성(schema와 같은 모양) / schema: 데이터 form, document: 실제 데이터
            title, // === title: title,
            description,
            fileUrl: video[0].location, // req.files의 video 배열 중 첫 요소(첫 파일)의 path 속성(file URL) 저장
            thumbUrl: thumb[0].location,
            owner: _id, // user의 _id property를 video의 owner로
            hashtags: Video.formatHashtags(hashtags),
        }); // 이 object는 생성과 동시에 db에 업로드 -> await 필요
        const user = await User.findById(_id);
        user.videos.push(newVideo._id); // user의 videos에 새로만든 video의 _id를 삽입
        user.save();
        return res.redirect("/"); // create()에서 error 없다면 home 화면으로
    } catch(error) { // 발생한 error를 받아서
        return res.status(400).render("upload", { 
            pageTitle: "Upload Video", 
            errorMessage: error._message, 
        }); // error의 _massage 속성을 전달하며 upload 페이지를 다시 렌더링
    }
};

export const deleteVideo = async(req, res) => {
    const { id } = req.params;
    const { user: { _id }, } = req.session;
    const video = await Video.findById(id);
    if(!video) {
        return res.status(404).render("404", { pageTitle: "Video not found." });
    }
    if(String(video.owner) !== _id) { // 비디오의 수정에 접근한 session의 user id가 video의 owner와 다르다면 수정 불가
        return res.status(403).redirect("/");
    }
    await Video.findByIdAndDelete(id);
    return res.redirect("/");
};

export const search = async(req, res) => {
    const { keyword } = req.query;
    let videos = [];
    if (keyword) {
        videos = await Video.find({
            title: {
                $regex: new RegExp(keyword, "i"), // mongoDB의 필터 엔진
            }
        }).populate("owner");
    }
    return res.render("search", { pageTitle: "Search", videos });
};

export const registerView = async(req, res) => { // 템플릿을 렌더링하지 않음
    const { id } = req.params;
    const video = await Video.findById(id);
    if(!video){
        return res.sendStatus(404);
    }
    video.meta.views = video.meta.views + 1;
    await video.save();
    return res.sendStatus(200);
};

export const createComment = async(req, res) => {
    const {
        session: { user },
        body: { text },
        params: { id },
    } = req;
    const video = await Video.findById(id);
    if(!video) {
        return res.sendStatus(404);
    }
    const comment = await Comment.create({
        text,
        owner: user._id,
        video: id,
    });
    video.comments.push(comment._id); // 해당 Video db에 comment 속성 추가
    video.save();
    res.status(201).json({ newCommentId: comment._id }); // 201: created
};

export const deleteComment = async(req, res) => {
    const { videoId, commentId } = req.params;
    const comment = await Comment.findById(commentId);
    const video = await Video.findById(videoId);
    if(!comment) {
        return res.sendStatus(404);
    }
    if(req.session.user._id !== String(comment.owner)) { // comment owner와 session의 user가 다를 경우
        return res.sendStatus(404);
    }
    video.comments.remove(commentId); // array에서 삭제
    video.save();
    await Comment.findByIdAndDelete(commentId); // DB에서 삭제

    return res.sendStatus(200);
};