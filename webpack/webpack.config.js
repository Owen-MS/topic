const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // 生成一个html
// 打包之后生成的一个映射
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
// 将css独立成一个文件
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: 'development',
  // entry: './src/index.js',
  entry: {
    index: './src/index.js',
    // another: './src/another-module.js',
  },
  output: {
    filename: '[name].[contenthash].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true, // 清理/dist文件夹
  },
  optimization: {
    // splitChunks: { // 用于将模块分离到单独的 bundle 中。
    //   chunks: 'all',
    // },
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
    // 模块标识符 保证你只处理你改动的文件的hash
    moduleIds: 'deterministic',
    // 将其设置为 single 来为所有 chunk 创建一个 runtime bundle：
    // 例如多个页面引入loadsh，防止重复，生成runtime.bundle.js，命中缓存消除请求，
    runtimeChunk: 'single',
  },
  // 选择一种source map格式来增强调试过程。不同得值会明显影响到构建和重新构建的速度
  // 看我链接去那里 https://www.cnblogs.com/axl234/p/6500534.html
  // devtool: 'eval-source-map',
  // devtool: 'none',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          // 因为这个插件需要干涉模块转换的内容，所以需要使用它对应的 loader
          MiniCssExtractPlugin.loader,
          // 'style-loader', // 如果选用分离css文件，记得禁用style.loader哟
          'css-loader'
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Output Management',
    }),
    new WebpackManifestPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css' // 这里也可以使用 [hash]
    })
  ],
  devServer: {
    contentBase: './dist',
    hot: true // 开启热更新
  }
};
