import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    avatarUrl: String,
    socialOnly: { type: Boolean, default: false},
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String }, // required를 하면 안 됨 (깃허브로 가입한 계정일 수 있기 때문)
    location: String,
    comments: [{ type: mongoose.Schema.Types.ObjectId, required: true, ref: "Comment" }],
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video"}],
});

userSchema.pre("save", async function() {
    if(this.isModified("password")) { // user의 password가 변경되면
        this.password = await bcrypt.hash(this.password, 5);
    }
});

const User = mongoose.model("User", userSchema);

export default User;