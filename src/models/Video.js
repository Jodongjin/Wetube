import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({ // video data Schema
    title: { type: String, required: true, trim: true, maxLength: 80 }, // === title: String
    fileUrl: { type: String, required: true },
    thumbUrl: { type: String, required: true },
    description: { type: String, required: true, trim: true, minLength: 10 },
    createdAt: { type: Date, required: true, default: Date.now },
    hashtags: [{ type: String, trim: true }], // string 배열
    meta: {
        views: { type: Number, default: 0, required: true },
    },
    comments: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: "Comment" }],
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User"},
});

videoSchema.static("formatHashtags", function(hashtags) {
    return hashtags.split(",").map((word) => (word.startsWith("#") ? word: `#${word}`));
});

const Video = mongoose.model("Video", videoSchema); // videoSchema 형태를 가진 Video라는 data model을 만듬
export default Video; // data model export -> server.js에서 import