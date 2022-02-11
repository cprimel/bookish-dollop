const path = require("path");

module.exports = {
  mode: "production",
  entry: path.resolve(__dirname, "./src/index.js"),
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
    ],
  },
  resolve: {
    extensions: ["*", ".js"],
    fallback: {
      "path": require.resolve("path-browserify")
    }
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "bundle.js",
    library: 'bundle'
  },
  devServer: {
    contentBase: path.resolve(__dirname, "./dist"),
  },
};
