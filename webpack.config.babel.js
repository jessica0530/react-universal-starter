import webpack from "webpack";
import path from "path";
import HtmlWebpackPugPlugin from "html-webpack-pug-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import UglifyJSPlugin from "uglifyjs-webpack-plugin";
import SWPrecacheWebpackPlugin from "sw-precache-webpack-plugin";

const env = {
  prod: process.env.NODE_ENV !== "development",
  dev: process.env.NODE_ENV === "development"
};
// utilities to add features based on env
const addEntity = (add, entity) => {
  return add ? entity : undefined;
};
const ifProd = entity => addEntity(env.prod, entity);
const ifDev = entity => addEntity(env.dev, entity);
const removeEmpty = array => array.filter(i => !!i);

const PUBLIC_PATH = env.prod ? "/" : "http://localhost:8888/";

// set contentBase
const contentBase = env.prod
  ? __dirname + "/tmp/static"
  : __dirname + "/src/client";

export default {
  mode: process.env.NODE_ENV,
  entry: removeEmpty([
    ifDev("react-hot-loader/patch"),
    ifDev("webpack-hot-middleware/client"),
    path.join(__dirname, "src/client/index.js")
  ]),
  output: {
    path: path.join(__dirname, "tmp/static"),
    filename: env.prod ? "[name].[chunkhash].js" : "[name].bundle.js"
  },
  devtool: env.dev ? "eval-source-map" : "source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
        include: path.join(__dirname, "./src/client")
      }
    ]
  },
  plugins: removeEmpty([
    ifDev(new webpack.HotModuleReplacementPlugin()),
    ifProd(
      new HtmlWebpackPlugin({
        title: "Summer",
        filename: "templates/index.pug",
        template: path.join(__dirname, "src/server/templates/index.prod.pug")
      })
    ),
    ifProd(new HtmlWebpackPugPlugin()),
    ifProd(
      new CopyWebpackPlugin([
        {
          from: "static"
        }
      ])
    ),
    ifProd(
      new UglifyJSPlugin({
        sourceMap: true
      })
    ),
    new SWPrecacheWebpackPlugin({
      cacheId: "react-universal-starter",
      dontCacheBustUrlsMatching: /\.\w{8}\./,
      filename: "service-worker.js",
      minify: true,
      navigateFallback: PUBLIC_PATH + "index.html",
      staticFileGlobsIgnorePatterns: [/\.map$/, /asset-manifest\.json$/]
    })
  ]),
  optimization: {
    occurrenceOrder: env.prod ? true : false,
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: "initial",
          minChunks: 2,
          maxInitialRequests: 5, // The default limit is too small to showcase the effect
          minSize: 0 // This is example is too small to create commons chunks
        },
        vendor: {
          test: /node_modules/,
          chunks: "initial",
          name: "vendor",
          priority: 10,
          enforce: true
        }
      }
    }
  }
};
