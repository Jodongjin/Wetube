const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path"); // import 문이랑 똑같음

const BASE_JS = "./src/client/js/";

module.exports = {
    entry: {
        main: BASE_JS + "main.js",
        videoPlayer: BASE_JS + "videoPlayer.js",
        recorder: BASE_JS + "recorder.js",
        commentSection: BASE_JS + "commentSection",
    }, // base js(변형될 js file)
    mode: 'development',
    plugins: [new MiniCssExtractPlugin({
        filename: "css/styles.css", // assets/css에 저장
    })],
    output: {
        filename: "js/[name].js", // assets/js에 저장
        path: path.resolve(__dirname, "assets"),
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/, // client/js/main.js에서 js code 감지되면 변형
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [['@babel/preset-env', { targets: "defaults" }]],
                    },
                },
            },
            {
                test: /\.scss$/,
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"], // sass에 의해 css가 되고 css가 import를 처리하고 Mini가 css file을 js file로부터 분리시켜 저장
            }
        ],
    },
};