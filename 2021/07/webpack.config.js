const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'development', // 指定构建模式
  entry: './src/index.js', // 指定构建入口文件
  entry: {
    main: './src/index.js' // 等同于
  },
  output: { // ./dist/main.js。默认创建的输出内容
    path: path.resolve(_dirname, 'dist'), // 指定构建生成文件所在的路径
    filename: 'bundle.js', // 指定构建生成的文件名字
  },
  rules: [
    {
      enforce: 'pre', // 指定为前置类型
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'eslint-loader',
    },
    {
      test: /\.(png|jpe?g|gif)$/,
      use: [
        {
          loader: 'file-loader',
          options: {}
        }
      ]
    },
    {
      test: /\.less/, // 匹配特定条件
      include: [ //  匹配特定路径 exclude 排除特定路径
        path.resolve(__dirname, 'src')
      ],
      use: [
        MiniCssExtractPlugin.loader, // 单独把css文件分离出来
        'style-loader',
        'css-loader',
        'less-loader'
      ]
    },
    {
      test: /\.jsx?/, // 匹配文件路径的正则表达式，通常我们都是匹配文件类型后缀
      include: [
        path.resolve(__dirname, 'src') // 指定那些路径下的文件需要经过loader处理
      ],
      type: 'javascript/auto', // 持现有的各种 JS 代码模块类型 —— CommonJS、AMD、ESM
      use: { // 指定使用的loader
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    }
  ],
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css' // 这里也可以使用 [hash]
    }), // 将 css 文件单独抽离的 plugin
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src') // 模糊匹配
    }
  }
}
