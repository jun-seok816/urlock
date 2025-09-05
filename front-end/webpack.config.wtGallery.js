const { merge } = require("webpack-merge");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");
const base = require("./webpack.base");

module.exports = merge(base, {
  entry : { index: "./webtoon-gallery/index.tsx" },
  output: {
    path    : path.resolve(__dirname, "../back-end/wtGallery"),
    filename: "index.js",
    clean   : false,                       // CleanWebpackPlugin이 대신 처리
  },

  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ["!index.html"],
      verbose: true,
    }),
  ],
});
