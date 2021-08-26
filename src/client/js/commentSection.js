import { async } from "regenerator-runtime";

const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
const deleteBtns = document.querySelectorAll(".deleteBtn");

const addComment = (text, id) => {
    const videoComments = document.querySelector(".video__comments ul");
    const newComment = document.createElement("li");
    newComment.dataset.id = id; // 새로운 comment에 id 부여
    newComment.className = "video__comment";
    const icon = document.createElement("i");
    icon.className = "fas fa-comment" // === .fas && .fa-comment
    const span = document.createElement("span");
    span.innerText = ` ${text}`
    const span2 = document.createElement("span");
    span2.innerText = "❌"; // 댓글을 작성한 사람이 owner이므로 x 버튼 보여도 됨
    span2.className = "deleteBtn";
    newComment.appendChild(icon);
    newComment.appendChild(span);
    newComment.appendChild(span2);
    videoComments.prepend(newComment);
    
    span2.addEventListener("click", handleDeleteComment);
}; // li > icon, span 구조 생성

const handleSubmit = async(event) => {
    event.preventDefault();
    const textarea = form.querySelector("textarea");
    const text = textarea.value;
    const videoId = videoContainer.dataset.id;
    if(text === "") {
        return; // textarea가 비었을 경우 함수 종료
    }
    const response = await fetch(`/api/videos/${videoId}/comment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
    });
    if(response.status === 201) {
        textarea.value = "";
        const { newCommentId } = await response.json();
        addComment(text, newCommentId);
    }
};

const handleDeleteComment = async(event) => {
    const targetComment = event.target.parentElement; // span의 부모 = li
    const { id } = targetComment.dataset;
    const videoId = videoContainer.dataset.id;
    const response = await fetch(`/api/${videoId}/comment/${id}/delete`, {
        method: "DELETE",
    });
    if(response.status === 200) {
        targetComment.remove();
    }
};

if(form) {
    form.addEventListener("submit", handleSubmit);
}

deleteBtns.forEach(btn => {
    btn.addEventListener("click", handleDeleteComment);
})