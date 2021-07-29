# 使用webpack定制前端开发环境

## 前言
webpack从4.x开始支持零配置，这样的改动可以是我们的基础使用变得更加的简单，但是根据不同项目的实际需要，我们还需要花费
一定的时间去配置webpack。

## webpack简介
webpack是一个JS代码模块化的打包工具。所以我们的CSS以及其他的一些文件其实一开始是被打包称JS的哦,
既然说是模块化打包工具，它会根据代码的内容解析模块依赖，帮助我们把多个模块的代码打包。


webpack的配置其实是一个Node的脚本，这个脚本对外暴漏一个配置对象。你可以使用任何Node模块，

为什么我们建议用ES6 module，因为我们tree 去处理未
被使用的代码是只支持import/export这种方式的

### 前端构建基础配置
- 构建我们发布需要的HTML、CSS、JS文件
- 使用CSS预处理器来编写样式
- 引用图片
- 使用Babel来支持ES新特性
- 本地提供静态服务器以方便开发调试

```js
const path = require('path');

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
    
    }
  ]
}
```
#### [mode](https://webpack.docschina.org/configuration/mode/#mode-development) 

构建模式是webpack V4引入的一个新概念，用于方便快捷的指定一些常用的默认优化配置，mode的枚举由`development`,`prodection`,
`none`。

顾名思义， `development`模式用于开发时使用，`production`模式用于线上生产时使用，`none`则是不需要默认任何优化配置

简单介绍一下`development`与`production`模式的区别：
- 这两个模式会使用`DefinePlugin`来将`process.env.NODE_ENV`的值分别设置为`development`和`production`，
方便开发者在项目业务代码中判断当前的构建模式。
- `production` 模式会启用[TerserPlugin](https://github.com/webpack-contrib/terser-webpac-plugin)
来压缩JS代码，让生成的代码文件更小。
- `devlopment`模式会启用 `devtools: 'eval'`配置，提升构建再构建的速度。

#### loader的作用

我们在前端构建中会遇到需要各式各样的文件，例如css代码，图片，模版代码等。webpack中提供一种处理多种文件格式的机制，
便是使用loader。我们可以把loader理解成一个转换器，负责把某种文件格式的内容转换成webpack可以支持打包的模块。

举个例子，在没有添加额外插件的情况下，webpack会默认把所有依赖打包成js文件，如果入口文件依赖一个.css的样式文件，
我们需要一个`css-loader`来处理.css文件，其实还需要`style-loader`,最终把不同格式的文件都解析成js。

实际上`css-loader`负责解析 CSS 代码，主要是为了处理 CSS 中的依赖，例如 `@import` 和 `url()` 等引用外部文件的声明；见,
 `style-loader`会将 `css-loader` 解析的结果转变成 JS 代码，运行时动态插入 `style` 标签来让 CSS 代码生效。.
 
例如： 使用babel来处理.js文件

#### plugin

在webpack的构建流程中` plugin`用于处理更多其他的一些构建任务。可以这么理解，模块代码转换的工作由`loader`来处理，
除此之外的其他工作都可以交由`plugin`来完成。例如常用的定义环境变量的[define-plugin](https://webpack.docschina.org/plugins/define-plugin/)

官网描述：插件目的在于解决 loader 无法实现的其他事。

plugin理论上可以干涉webpack整个构建流程，可以在流程的每一个步骤中定制自己的构建需求。

#### 模块解析 resolve配置
resolve是一个帮助寻找模块绝对路径的库。一个模块可以作为另一个模块的依赖模块，然后被后者引用：
```js
import foo from 'path/to/module';
// 或者
require('path/to/module');
```
所依赖的模块可以是来自应用程序的代码或者第三方库。resolve帮助webpack从每个require/import语句中，找到需要引入
到bundle中的模块代码。当打包模块时，webpack使用[**enhanced-resolve**](https://github.com/webpack/enhanced-resolve/)
来解析文件路径。
##### webpack解析规则

######  [resolve.alias](https://webpack.docschina.org/configuration/resolve/#resolvealias)
```js
const path = require('path');

module.exports = {
  //...
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      Utilities$: path.resolve(__dirname, 'src/utilities/'), // 精准匹配
      Templates: path.resolve(__dirname, 'src/templates/'),
    },
  },
};
```
######  [resolve.extensions](https://webpack.docschina.org/configuration/resolve/#resolveextensions)
```js
import * as common from './src/utils/common';
extensions: ['.wasm', '.mjs', '.js', '.json', '.jsx']
// 这里的顺序代表匹配后缀的优先级，例如对于 index.js 和 index.jsx，会优先选择 index.js

// 但如果引入时如果后缀匹配不上的化，webpack构建时则会报无法解析模块的错误。
// 当然，你可以手动添加.css后缀，或者在选项中添加css的配置。
```
######  [resolve.modules](https://webpack.docschina.org/configuration/resolve/#resolvemodules)

对于直接声明依赖名的模块（如`react`），webpack会类似Node.js一样进行路径搜索，搜索node_modules目录，
这个目录就是使用`resolve.modules`字段进行配置的，
默认：
```js
resolve: {
  modules: ['node_modules']
}
```
######  [resolve.mainFields](https://webpack.docschina.org/configuration/resolve/#resolvemainfields)
```js
resolve: {
  // 配置 target === "web" 或者 target === "webworker" 时 mainFields 默认值是：
  mainFields: ['browser', 'module', 'main'],

  // target 的值为其他时，mainFields 默认值为：
  mainFields: ["module", "main"]
}
```
想看[target](https://webpack.docschina.org/concepts/targets/#multiple-targets) 看这里

因为通常情况下，模块的 package 都不会声明 `browser` 或 `module` 字段，所以便是使用 `main` 了。

在 NPM packages 中，会有些 package 提供了两个实现，分别给浏览器和 Node.js 
两个不同的运行时使用，这个时候就需要区分不同的实现入口在哪里。
如果你有留意一些社区开源模块的 package.json 的话，你也许会发现 browser 或者 module 等字段的声明。
######  [resolve.mainFiles](https://webpack.docschina.org/configuration/resolve/#resolvemainfiles)
```js
module.exports = {
  //...
  resolve: {
    mainFiles: ['index'],  // 你可以添加其他默认使用的文件名
  },
};
```

- 绝对路径
```js
import '/home/me/file';

import 'C:\\Users\\me\\file';
```
由于已经获得文件的绝对路径，因此不需要再做进一步解析。

- 相对路径

```js
import '../src/file1';
import './file2';
```

在这种情况下，使用`impor`t或`require`的资源文件所处的目录，被认为是上下文目录。在`import/require`中
给定的相对路径，会拼接此上下文路径，来生成模块的绝对路径。

1. 查找相对当前模块的路径下是否有对应文件或文件夹
2. 是文件则直接加载
3. 是文件夹则继续查找文件夹下的 package.json 文件
4. 有 package.json 文件则按照文件中 main 字段的文件名来查找文件
5. 无 package.json 或者无 main 字段则查找 index.js 文件

- 模块路径

```js
import 'module';
import 'module/lib/file';
```
查找当前文件目录下，父级目录及以上目录下的 node_modules 文件夹，看是否有对应名称的模块







## webpack基础细节梳理
### 1、本地开发的三种方式
#### first Watch Mode
```
 "scripts": {
     "watch": "webpack --watch",
     "build": "webpack"
 }
```
缺点是你需要手动刷新浏览器才能看到修改后的代码
#### Second webpack-dev-server
`webpack-dev-server` 为你提供了一个基本的 `web server`，并且具有 `live reloading`(实时重新加载) 功能
`webpack-dev-server` 会从 `output.path` 
中定义的目录为服务提供 `bundle` 文件，即，
文件将可以通过
 http://[devServer.host]:[devServer.port]/[output.publicPath]/[output.filename] 进行访问。
```
yarn add webpack-dev-server -D

"scripts": {
    "build": "webpack",
    "serve": "webpack-dev-server"
  }
 devServer: {
    contentBase: './dist',
 }
```
#### third [webpack-dev-middleware](https://webpack.docschina.org/guides/development/#using-webpack-dev-middleware)
使用express手动启一个服务，然后通过`app.use`指定你热更新的页面

### 2、[source map](https://www.cnblogs.com/axl234/p/6500534.html)

### 3、[代码分离](https://webpack.docschina.org/guides/code-splitting/)
```js
   optimization: {
     splitChunks: {
       chunks: 'all'
     }
   }
```
使用 `optimization.splitChunks` 配置选项之后，
现在应该可以看出，`index.bundle.js` 和 `another.bundle.js` 
中已经移除了重复的依赖模块。
需要注意的是，插件将 `lodash` 分离到单独的 `chunk`，
并且将其从 `main bundle` 中移除，减轻了大小。执行 npm run build 查看效果

### 4、[缓存](https://webpack.docschina.org/guides/caching/)

可以通过命中缓存，以降低网络流量，使网站加载速度更快，然而，
如果我们在部署新版本时不更改资源的文件名，浏览器可能会认为它没有被更新，
就会使用它的缓存版本。由于缓存的存在，当你需要获取新的代码时，就会显得很棘手。

- 输出文件的文件名，文件名称hash
- 提取引导模版 可使用 optimization.runtimeChunk 选项将 runtime 代码拆分为一个单独的 chunk。
- 模块标识符 `optimization.moduleIds` 设置为 `'deterministic'`
```
optimization: {
     moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },
```
### 5、[环境变量](https://webpack.docschina.org/guides/environment-variables/)
对于我们的 webpack 配置，有一个必须要修改之处。
通常，`module.exports` 指向配置对象。
要使用 `env` 变量，你必须将 `module.exports` 转换成一个函数：
```
npx webpack --env goal=local --env production --progress

module.exports = (env) => {
  // Use env.<YOUR VARIABLE> here:
  console.log('Goal: ', env.goal); // 'local'
  console.log('Production: ', env.production); // true

  return {
    entry: './src/index.js',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
    },
  };
};
```
### 6、[构建性能](https://webpack.docschina.org/guides/build-performance/)
此处请仔细看名称，只是构建性能，是webpack优化中的一个篇幅
