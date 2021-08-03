const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // 生成一个html
// 打包之后生成的一个映射
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
// 将css独立成一个文件
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const DashboardPlugin = require("webpack-dashboard/plugin");
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const AutoDllPlugin = require('autodll-webpack-plugin');

module.exports = (env, argv) => {
  return {
    // 模式，2种：生产模式(production)和开发模式(development)
    // 开发模式不压缩打包后代码，生产模式压缩打包后代码
    mode: 'development',
    // entry: './src/index.js',
    entry: {
      main: './src/index.js',
      // another: './src/another-module.js',
      // md: './README.md'
      less: './src/less.less'
    },
    output: {
      filename: '[name].[hash:6].bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true, // 清理/dist文件夹
    },
    // 优化配置，虽然webpack4开始，会根据你选择的mode来执行不同的优化，
    // 不过所有的优化还是可以手动配置和重写。
    optimization: {
      // concatenateModules: true,
      // splitChunks: { // 用于将模块分离到单独的 bundle 中。
      //   chunks: 'all',
      // },
      // splitChunks: {
      //   cacheGroups: {
      //     vendor: {
      //       test: /[\\/]node_modules[\\/]/,
      //       name: 'vendors',
      //       chunks: 'all',
      //     },
      //   },
      // },
      // 模块标识符 保证你只处理你改动的文件的hash
      // moduleIds: 'deterministic',
      // 将其设置为 single 来为所有 chunk 创建一个 runtime bundle：
      // 例如多个entry引入lodash，防止重复，生成runtime.bundle.js，命中缓存消除请求，
      // runtimeChunk: 'single',
    },
    // 选择一种source map格式来增强调试过程。不同得值会明显影响到构建和重新构建的速度
    // 看我链接去那里 https://www.cnblogs.com/axl234/p/6500534.html
    devtool: 'eval-source-map',
    // devtool: 'none',

    // 这些选项决定了如何处理项目中不同类型的模块
    module: {
      noParse: /jquery|lodash/,
      rules: [
        {
          test: /\.md$/,
          use: [
            {
              loader: 'html-loader'
            },
            {
              loader: path.resolve('./loader/index.js')
            }
          ]
        },
        {
          test: /\.less$/,
          use: [
            {
              loader: path.resolve('./loader/lessLoad.js')
            }
          ]
        },
        // {
        //   test: /\.jsx?$/,
        //   use: ['thread-loader', 'cache-loader', 'babel-loader']
        // },
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
          // use: {
          //   loader: 'url-loader',
          //   options: {
          //     // 打包少于1000kb用base64，否则使用file-loader产生文件
          //     limit: 1000,
          //     // 产出路径
          //     outputPath: 'img/',
          //     // 只给图片添加前缀，如果使用publicPath,outputPath无效
          //     // publicPath: 'http://itssh.cn/'
          //   }
          // },
          type: 'asset/resource',
        }
      ]
    },
    plugins: [
      // new BundleAnalyzerPlugin(),
      // new DashboardPlugin(),
      new HtmlWebpackPlugin({
        inject: true, // will inject the main bundle to index.html
        title: 'Output Management',
      }),
      // new AutoDllPlugin({
      //   inject: true, // will inject the DLL bundle to index.html
      //   debug: true,
      //   filename: '[name]_[hash].js',
      //   path: './dll',
      //   entry: {
      //     vendor: [
      //       'lodash'
      //     ]
      //   }
      // }),
      new WebpackManifestPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].css' // 这里也可以使用 [hash]
      })
    ],
    devServer: {
      port: 8008,
      // contentBase: './dist',
      // 进度条
      progress: true,
      stats: 'errors-only', //终端仅打印 error
      hot: true // 开启热更新
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src') // 模糊匹配
      },
      extensions: ['.js', '.json', '.jsx'],
      modules: ['node_modules'],
      mainFiles: ['index'],  // 你可以添加其他默认使用的文件名
      mainFields: ['browser', 'module', 'main'],
    },
    cache: false, // 开发true 生产false
    target: 'web', //webpack 能够为多种环境或 target 构建编译。例如noede、electron
    watch: false, // webpack 可以监听文件变化，当它们修改后会重新编译 可以设置延迟构建
    externals: { // 外部依赖，不打包，而是在运行时再从外部获取, 一些CDN包
      jquery: 'jQuery',
      // lodash: 'lodash'
    },
    // performance: { // 控制webpack如何通过[资源asset和入口起点超过指定文件限制]
    //   hints: 'error' , // 例如一个超过250K大的资源就给你一个警告，一般在开发环境
    // },
    node: false, // 默认
  };
}
