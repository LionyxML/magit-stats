// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const ShebangPlugin = require("webpack-shebang-plugin");

const isProduction = process.env.NODE_ENV == "production";

const config = {
  target: "node",
  entry: {
    "magit-stats": path.resolve(__dirname, "src/index.ts"),
  },
  output: {
    path: path.resolve(__dirname, "bin"),
    chunkFilename: "[name].cjs",
    filename: "[name].cjs",
  },
  plugins: [new ShebangPlugin()],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
