import User from "../models/User";
import Video from "../models/Video";
import fetch from "node-fetch";
import bcrypt from "bcrypt";

export const getJoin = (req, res) => 
    res.render("join", { pageTitle: "Join" }); // 하나씩 export할 경우에 변수 앞에 export keyword

export const postJoin = async(req, res) => {
    const pageTitle = "Join";
    const { name, email, username, password, password2, location } = req.body;
    if(password !== password2) {
        return res.status(400).render(pageTitle, { // return하지 않으면 아래 코드가 계속 진행될 것
            pageTitle: "Join",
            errorMessage: "Password confirmation does not match.",
        });
    }
    const exists = await User.exists({ $or: [{ username: username }, { email: email }] }); // username, email 중복 검사 (db)
    if(exists) {
        return res.status(400).render(pageTitle, {
            pageTitle: "Join",
            errorMessage: "This username/email is already taken.",
        });
    }
    try {
        await User.create({
            name,
            email,
            username,
            password,
            location,
        });
        return res.redirect("/login");
    } catch(error) {
        return res.status(400).render("join", { 
            pageTitle: "Join", 
            errorMessage: error._message, });
    }
    
    
};

export const getLogin = (req, res) => 
    res.render("login", { pageTitle: "Login" });

export const postLogin = async(req, res) => {
    const pageTitle = "Login";
    const { username, password } = req.body;
    const user = await User.findOne({ username: username, socialOnly: false }); // 가입된 user가 있으면 socialOnly가 false인 경우에만 로그인 허용
    if(!user) {
        return res.status(400).render("login", { 
            pageTitle, 
            errorMessage: "An account with this username does not exists.",
        });
    }
    const ok = await bcrypt.compare(password, user.password); // hash하여 비교
    if(!ok) {
        return res.status(400).render("login", { 
            pageTitle, 
            errorMessage: "Wrong password.",
        });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
};

export const startGithubLogin = (req, res) => {
    const baseUrl = "https://github.com/login/oauth/authorize"
    const config = {
        client_id: process.env.GH_CLIENT, // 깃허브 url이 받는 parameter와 이름 맞춰줘야함
        allow_signup: false,
        scope: "read:user user:email",
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    return res.redirect(finalUrl);
};

export const finishGithubLogin = async(req, res) => {
    const baseUrl = "https://github.com/login/oauth/access_token";
    const config = {
        client_id: process.env.GH_CLIENT,
        client_secret: process.env.GH_SECRET,
        code: req.query.code, // 깃허브가 callback Url에 제공해주는 "code" property
    }
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    const tokenRequest = await (await fetch(finalUrl, { // Url에 데이터 요청(POST request) -> access token return, then() 대신에 await 사용
        method: "POST",
        headers: {
            Accept: "application/json", // json으로 받아야함
        },
    })).json(); // 받은 데이터를 json화 / 처음 await는 json()을 위한 await / 바로 token을 받음
    if("access_token" in tokenRequest) { // json에 access_token property가 있다면
        const { access_token } = tokenRequest; // access_token 값을 꺼내와서
        const apiUrl = "https://api.github.com";
        const userData = await (await fetch(`${apiUrl}/user`, { // 깃허브 API / fetch -> default = GET 인 듯?
            headers: {
                Authorization: `token ${access_token}`, // docs 참조
            }
        })).json(); // 깃허브 user에 대한 정보가 담긴 json
        const emailData = await (await fetch(`${apiUrl}/user/emails`, { // 깃허브 API / fetch -> default = GET 인 듯?
            headers: {
                Authorization: `token ${access_token}`, // docs 참조
            }
        })).json();
        const emailObj = emailData.find((email) => email.primary === true && email.verified === true); // emailData(array)의 각 요소(email) 중 찾기
        if(!emailObj) {
            return res.redirect("/login");
        }
        let user = await User.findOne({ email: emailObj.email }); // 깃허브가 제공하는 user의 email에 해당하는 db 상의 user 탐색
        if(!user) { // 깃허브 email에 해당되는 user가 db에 없을 때
            user = await User.create({ // 해당되는 깃허브 email이 user db에 없을 경우 깃허브로부터 받은 userData로 회원가입 진행 (자동가입 & 로그인)
                avatarUrl: userData.avatar_url, 
                name: userData.name,
                email: emailObj.email,
                username: userData.login,
                password: "",
                socialOnly: true, // socialOnly가 true인 경우, password를 통한 로그인은 불가
                location: userData.location,
            });
        } // 따라서 username, password로 가입했어도 깃허브로 로그인 가능
        req.session.loggedIn = true;
        req.session.user = user;
        return res.redirect("/");
    } else {
        return res.redirect("/login");
    }
};

export const logout = (req, res) => {
    req.session.destroy(); // session 삭제
    return res.redirect("/");
};

export const getEdit = (req, res) => {
    return res.render("edit-profile", { pageTitle: "Edit Profile" });
};

export const postEdit = async(req, res) =>  {
    const { 
        session: {
            user: { _id, avatarUrl },
        },
        body: { name, email, username, location },
        file, // req.file.path (파일이 있는 경로 -> uploads/)
    } = req; // === const id = req.session.user.id / req에서 session.user.id와 body 한 번에 가져옴
    const emailExists = await User.exists({ email });
    const usernameExists = await User.exists({ username });

    if (req.session.user.email !== req.body.email && emailExists) { // session의 email과 input의 email이 다르고 input의 email이 db에 존재할 때
        return res.status(400).render("edit-profile", { pageTitle: "Edit Profile", errorMessage: "Email already exists"});
    }
    if(req.session.user.username !== req.body.username && usernameExists) { // session의 username과 input의 username이 다르고 input의 username이 db에 존재할 때
        return res.status(400).render("edit-profile", { pageTitle: "Edit Profile", errorMessage: "Username already exists"});
    }
    const updatedUser = await User.findByIdAndUpdate(
        _id, 
        {
            avatarUrl: file ? file.location : avatarUrl,
            name,
            email,
            username,
            location, // 해당되는 이름의 property를 찾아 값을 넣어줌
        },
        { new: true }, // update된 object 받기
    );
    req.session.user = updatedUser;
    res.redirect("/users/edit");
};

export const getChangePassword = (req, res) => {
    if(req.session.user.socialOnly === true) {
        req.flash("error", "Can't change password.");
        return res.redirect("/");
    }
    return res.render("users/change-password", { pageTitle: "Change Password" });
};

export const postChangePassword = async(req, res) => {
    const { 
        session: {
            user: { _id }, // 현재 로그인된 사용자를 확인하고
        },
        body: { oldPassword, newPassword, newPasswordConfirmation }, // form에서 input value를 가져옴
    } = req;
    const user = await User.findById(_id); // db에서 user object를 꺼내옴
    const ok = await bcrypt.compare(oldPassword, user.password);
    if(!ok) {
        return res.status(400).render("users/change-password", 
        { pageTitle: "Change Password", errorMessage: "The current password is incorrect." });
    }

    if(newPassword !== newPasswordConfirmation) {
        return res.status(400).render("users/change-password", 
        { pageTitle: "Change Password", errorMessage: "The password does not match the confirmation." });
    }
    user.password = newPassword;
    await user.save(); // 해쉬된 password 저장
    req.flash("info", "Password Updated"); // send norification
    return res.redirect("/users/logout");
};

export const see = async(req, res) => {
    const { id } = req.params; // 프로필은 모두가 볼 수 있어야하기 때문에 session에서 가져오지 않음 (session에서 가져오면 본인의 프로필만 볼 수 있음)
    const user = await User.findById(id).populate({
        path: "videos",
        populate: {
            path: "owner",
            model: "User",
        },
    }); // user id에 해당되는 user의 videos 속성에 있는 video id를 기반으로 Video db에서 video object들 가져옴
    if(!user) {
        return res.status(404).render("404", { pageTitle: "User not found." });
    }
    return res.render("users/profile", { pageTitle: user.name, user });
} 