import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
const actionBtn = document.getElementById("actionBtn");
const video = document.getElementById("preview");

let stream;
let recorder;
let videoFile;

const files = {
    input: "recording.webm",
    output: "output.mp4",
    thumb: "thumbnail.jpg",
}

const downloadFile = (fileUrl, fileName) => {
    const a = document.createElement("a");
    a.href = fileUrl; // 브라우저 메모리 URL
    a.download = fileName; // a tag에 down로드 속성 추가해주면 해당 URL로 이동하는 게 아니라 file을 다운로드해줌 (인자는 저장될 파일의 이름.확장자)
    document.body.appendChild(a);
    a.click(); // Download Recording 버튼을 클릭한 걸 a 링크를 클릭한 것처럼
}

const handleDownload = async() => {
    actionBtn.removeEventListener("click", handleDownload); // 더 이상 이벤트를 발생시킬 수 없게
    actionBtn.innerText = "Transcoding...";
    actionBtn.disabled = true;
    const ffmpeg = createFFmpeg({ corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js", log: true }); // ffmpeg object 생성
    await ffmpeg.load(); // ffmpeg 소프트웨어 불러오기 / js code가 아닌 소프트웨어를 사용하는 것 (db처럼) -> 완료를 기다려야함

    // 파일 생성
    ffmpeg.FS("writeFile", files.input, await fetchFile(videoFile)); // FS: File System memory(ffmpeg 가상 컴퓨터)에 생성 / videoFile = ObjectUrl(생성한 video file)

    // transcording
    await ffmpeg.run("-i", files.input, "-r", "60", files.output); // webm -> mp4 transcoding (초당 60프레임으로 인코딩) / "-i": input
    await ffmpeg.run(
        "-i", 
        files.input, 
        "-ss", // "-ss": 특정 시간대
        "00:00:01", 
        "-frames:v", "1", // "-frames:v", "1": 첫 프레임의 스크린샷
        files.thumb // output
    ); // .webm -> .jpg

    // 파일 불러오기
    const mp4File = ffmpeg.FS("readFile", files.output); // encoding된 파일 가져오기
    const thumbFile = ffmpeg.FS("readFile", files.thumb);

    console.log(mp4File.buffer);

    // blob 생성
    const mp4Blob = new Blob([mp4File.buffer], { type: "video/mp4" }); // blob 생성
    const thumbBlob = new Blob([thumbFile.buffer], { type: "image/jpg" });

    // 브라우저 메모리의 URL 생성
    const mp4Url = URL.createObjectURL(mp4Blob); // 브라우저 메모리 URL 생성
    const thumbUrl = URL.createObjectURL(thumbBlob);

    downloadFile(mp4Url, "MyRecording.mp4");
    downloadFile(thumbUrl, "MyThumbnail.jpg");

    ffmpeg.FS("unlink", files.input); // FS에 만든 파일들 제거
    ffmpeg.FS("unlink", files.output);
    ffmpeg.FS("unlink", files.thumb);

    URL.revokeObjectURL(mp4Url); // 브라우저 URL 제거
    URL.revokeObjectURL(thumbUrl);
    URL.revokeObjectURL(videoFile);

    actionBtn.disabled = false;
    actionBtn.innerText = "Recording Again";
    actionBtn.addEventListener("click", handleStart); // 다시 녹화할 수 있게
};

const handleStart = () => {
    actionBtn.innerText = "Recording";
    actionBtn.disabled = true;
    actionBtn.removeEventListener("click", handleStart); // 진행중인 listener를 제거하고 -> event의 종류와 func 맞춰야함 ("click", handleStart)
    recorder = new MediaRecorder(stream); // stream을 전달하며 recorder object 생성 (녹화기)
    recorder.ondataavailable = (event) => { // video.stop()후에 발동되는 handler / data property가 있는 blob event -> 사용자가 다운로드 가능
        videoFile = URL.createObjectURL(event.data); // 녹화된 video data를 전달하며 파일로 만듬
        video.srcObject = null; // srcObject를 비우고 src setting 해야함
        video.src = videoFile; // video element의 src를 대체(브라우저 메모리 URL)
        video.loop = true; // 비디오 반복재생 설정
        video.play(); // 녹화된 video 재생
        actionBtn.innerText = "Download";
        actionBtn.disabled = false;
        actionBtn.addEventListener("click", handleDownload);
    };
    recorder.start(); // 녹화 시작
    setTimeout(() => {
        recorder.stop();
    }, 5000); // 5초가 지난 후 자동으로 녹화 종료, 다운로드 버튼 생성
};

const init = async() => {
    stream = await navigator.mediaDevices.getUserMedia({ 
        audio: false, 
        video: {
            width: 1024,
            height: 576,
        },
    });
    video.srcObject = stream; // src를 담는 기능 (strema: 카메라와 element의 연결 정도?)
    video.play();
};

init();

actionBtn.addEventListener("click", handleStart);