const video = document.querySelector("video"); // 최상위에 있는 video tag 가져옴
const playBtn = document.getElementById("play");
const playBtnIcon = playBtn.querySelector("i");
const muteBtn = document.getElementById("mute");
const muteBtnIcon = muteBtn.querySelector("i");
const volumeRange = document.getElementById("volume");
const currenTime = document.getElementById("currenTime");
const totalTime = document.getElementById("totalTime");
const timeline = document.getElementById("timeline");
const fullScreenBtn = document.getElementById("fullScreen");
const fullscreenIcon = fullScreenBtn.querySelector("i");
const videoContainer = document.getElementById("videoContainer");
const videoControls = document.getElementById("videoControls");

let controlsTimeout = null;
let controlsMovementTimeout = null;
let volumeValue = 0.5;
video.volume = volumeValue;

const handleKeydown = (event) => {
    event.preventDefault();
    const { code } = event;
    if(code === "Space") {
        handlePlayClick();
    }
};

const handlePlayClick = (e) => {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
    playBtnIcon.classList = video.paused ? "fas fa-play" : "fas fa-pause";
}; // video play control

const handleMute = (e) => {
    if(video.muted) {
        video.muted = false;
    } else {
        video.muted = true;
    }
    muteBtnIcon.classList = video.muted ? "fas fa-volume-mute" : "fas fa-volume-up";
    volumeRange.value = video.muted ? 0 : volumeValue;
}; // video mute control

const handleVolumeChange = (event) => {
    const { target: { value } } = event; // 드래그에 실시간으로 발생하는 event 객체에서 event.target.value property 가져옴
    if(video.muted) {
        video.muted =false;
        muteBtn.innerText = "Mute";
    }
    volumeValue = value; // 전역변수인 volume update
    video.volume = value; // video volume change
};

const formatTime = (second) => new Date(second * 1000).toISOString().substr(14, 5);

const handleLoadedMetadata = () => {
    totalTime.innerText = formatTime(Math.floor(video.duration)); // read-only property (수정불가) / floor: 버림
    timeline.max = Math.floor(video.duration); // timeline range의 max를 비디오 총시간으로 / metadata가 로드될 때 최댓값 설정
};

const handleTimeUpdate = () => {
    currenTime.innerText = formatTime(Math.floor(video.currentTime));
    timeline.value = Math.floor(video.currentTime); // timeline의 값을 비디오의 현재시간으로 매번 Update
};

const handleTimelineChange = (event) => {
    const { target: { value } } = event;
    video.currentTime = value; // currnetTime은 getter이자 setter
};

const handleFullscreen = () => {
    const fullscreen = document.fullscreenElement;
    if(fullscreen) {
        document.exitFullscreen();
        fullScreenIcon.classList = "fas fa-expand";
    } else {
        videoContainer.requestFullscreen();
        fullScreenIcon.classList = "fas fa-compress";
    }
};

const hideControls = () => videoControls.classList.remove("showing");

const handleMouseMove = () => {
    if(controlsTimeout) {
        clearTimeout(controlsTimeout); // 현재 controlsTimeout이 작동중이면 종료
        controlsTimeout = null;
    }
    if(controlsMovementTimeout) { // 마우스 움직임을 멈추면 controlsMovement = null인 상태이므로 이 if문 진입 x
        clearTimeout(controlsMovementTimeout);
        controlsMovementTimeout = null;
    }
    videoControls.classList.add("showing");
    controlsMovementTimeout = setTimeout(hideControls, 3000); // 마우스가 움직일 때마다 3초 뒤 controls 사라지게 하는 Timeout 가동 (움직일 때마다 reset)
};

const handleMouseLeave = () => {
    controlsTimeout = setTimeout(hideControls, 3000);
};

const handleEnded = () => {
    const { id } = videoContainer.dataset;
    fetch(`/api/videos/${id}/view`, {
        method: "POST",
    }); // 우리의 서버로 api request
};

playBtn.addEventListener("click", handlePlayClick);
muteBtn.addEventListener("click", handleMute);
volumeRange.addEventListener("input", handleVolumeChange);
video.addEventListener("loadeddata", handleLoadedMetadata); // 브라우저가 video의 메타데이터를 로드했을 때
video.addEventListener("timeupdate", handleTimeUpdate); // 영상이 재생되는 동안 매번 호출
video.addEventListener("click", handlePlayClick);
video.addEventListener("dblclick", handleFullscreen);
video.addEventListener("ended", handleEnded);
videoContainer.addEventListener("mousemove", handleMouseMove);
videoContainer.addEventListener("mouseleave", handleMouseLeave);
timeline.addEventListener("input", handleTimelineChange);
fullScreenBtn.addEventListener("click", handleFullscreen);
document.addEventListener("keydown", handleKeydown);