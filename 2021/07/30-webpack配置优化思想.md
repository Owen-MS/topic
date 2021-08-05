# webpack进阶优化思想

## 解决上次遗留疑问-**[防止重复(prevent duplication)](https://bundlers.tooling.report/code-splitting/multi-entry/)**
### vendors文件是什么，怎么产生的，作用是什么？
供应商
使用`optimization.splitChunks` 配置选项之后，
现在应该可以看出，`main.bundle.js` 和 `another.bundle.js `
中已经移除了重复的依赖模块。需要注意的是，
插件将 `lodash` 分离到单独的 `chunk`，并且将其从 `main bundle` 中移除，减轻了大小。

### runtime文件是什么，怎么产生的，作用是什么？
如果我们要在一个HTML页面上使用多个入口时，还需要设置`optimization.runtimeChunk: 'single'`

产生原因：
```js
 module.exports = {
  // ...
  optimization: {
    runtimeChunk: 'single',
  },
 };
```
这时候我们会发现生成了一个`runtime.bundle.js`


## 构建策略
我们在配置webpack的配置以及依据当前项目来做优化配置时，其实都是追寻又快又小。衡量标准那就是，从时间层面和体积层面。

**那小怎么小呢**
- 图片  image-webpack-loader压缩图片， url-loader 图片精灵CSS Sprites 减少图片请求
- css postcss-loaderCSS压缩， mini-css-extract-plugin 单独拆css文件
- JS 例如tree-shaking删除冗余的代码，splitChunks 单独拆重复引用JS文件 ， TerserPlugin压缩代码， 
IgnorePlugin忽略某些特定模块，抛弃source Map

**那快又怎么快呢**

- 减少resolve的解析，在查询模块路径时尽可能快速地定位到需要的模块，不做额外的查询工作
- 把loader应用的文件范围缩小，例如显示只处理src目录下，
- 减少plugin的消耗，
- 选择何时的devtool，抛弃source Map

 **减少打包时间：** <font color=#FF6A6A>缩减范围、缓存副本、定向搜索、提前构建、并行构建、可视结构</font>

 **减少打包体积：** <font color=#FF6A6A>分割代码、遥数优化、动态垫片、按需加载、作用提升、压缩资源</font>

### 1、缩减范围
**配置include/exclude缩小Loader对文件的搜索范围** 好处是 <font color=#FF6A6A>
避免不必要的转译。node_module目录</font>那么大。
```js
export default {
    // ...
    module: {
        rules: [{
            exclude: /node_modules/,
            include: /src/,
            test: /\.js$/,
            use: "babel-loader"
        }]
    }
};
```
### 2、缓存副本
**配置cache缓存Loader对文件的编译副本，** 好处是<font color=#FF6A6A>再次编译的时只编译修改过的文件</font>。
未修改过的文件干嘛要随着修改。

大部分的`loader/plugin`都会提供一个可使用编译缓存的选项，通常包含`cache`字眼。
如果不支持呢，看这里 [cache-loader](https://www.npmjs.com/package/cache-loader)

```js
import EslintPlugin from "eslint-webpack-plugin";

export default {
    // ...
    module: {
        rules: [{
            // ...
            test: /\.js$/,
            use: [{
                loader: "babel-loader",
                options: { cacheDirectory: true }
            }]
        }]
    },
    plugins: [
        new EslintPlugin({ cache: true })
    ]
};
```
### 3、定向搜索

**配置resolve提高文件的搜素速度，好处是**
<font color=#FF6A6A>定向执行必须文件路径。</font>
若某些第三方库以常规形式引入可能报错或希望程序自动索引特定类型文件都可通过该方式解决。
<font color=#FF6A6A>alias</font>映射模块路径，<font color=#FF6A6A>extensions</font>表明文件后缀，
<font color=#FF6A6A>noParse</font>过滤无依赖文件。
```js
export default {
    // ...
    resolve: {
        alias: {
            "#": AbsPath(""), // 根目录快捷方式
            "@": AbsPath("src"), // src目录快捷方式
            swiper: "swiper/js/swiper.min.js"
        }, // 模块导入快捷方式
        extensions: [".js", ".ts", ".jsx", ".tsx", ".json", ".vue"] // import路径时文件可省略后缀名
    }
};
```
### 4、提前构建
配置`DLLPlugin`**将第三方依赖提前打包**，好处是<font color=#FF6A6A>将DLL将业务代码完全分离且每次只构建
业务代码。</font>这是一个古老的配置，在`webpack v2`时已经存在，不过现在`webpack v4+`已不推荐使用该配置，
因为其版本带来的性能提升足以忽略`DllPlugin`所带来的收益。

`DLL`意为`Dynamic Link Library`<font color=#FF6A6A>动态链接库</font>，指一个包含可由多个程序同时使用的
代码库。在前端领域可认为时另类缓存的存在，它把公共代码打包为DLL文件并存到硬盘里，再次打包时动态链接`DLL文件`
就无需再次打包那些公共代码，从而提升构建速度

可手动配置或者采用[autodll-webpack-plugin](https://github.com/asfktz/autodll-webpack-plugin)
代替手动配置
```js
plugins: [
  new HtmlWebpackPlugin({
    inject: true,
    template: './src/index.html',
  }),
  new AutoDllPlugin({
    inject: true, // will inject the DLL bundles to index.html
    debug: true,
    filename: '[name]_[hash].js',
    path: './dll',
    entry: {
      vendor: [
        'react',
        'react-dom'
      ]
    }
  })
]
```

Webpack 配置中的 [externals](https://webpack.docschina.org/configuration/externals/) 和 
[DllPlugin](https://webpack.docschina.org/plugins/dll-plugin/) 解决的是同一类问题：
将依赖的框架等模块从构建过程中移除。它们的区别在于：
1. 在 `Webpack` 的配置方面，`externals` 更简单，而 `DllPlugin` 需要独立的配置文件。
2. `DllPlugin` 包含了依赖包的独立构建流程，而 `externals` 配置中不包含依赖框架的生成方式，通常使用已传入 CDN 的依赖包。
3. `externals` 配置的依赖包需要单独指定依赖模块的加载方式：全局对象、`CommonJS`、`AMD` 等。
4. 在引用依赖包的子模块时，`DllPlugin` 无须更改，而 `externals` 则会将子模块打入项目包中。

### 5、并行构建

**配置Thread将Loader单进程转换为多进程，** 好处是<font color=#FF6A6A>释放CPU多核并发的优势</font>。
在使用webpack构建项目时会有大量文件需解析和处理，构建过程中是计算密集型的操作，随着文件增多会使构建过程变得越慢。

运行在`Node`里的`webpack`是单线程模型，简单来说就是`webpack`待处理的任务需一件件处理，不能同一时刻处理多件任务。

`文件读写`与`计算操作`是无法避免的，能不能让`webpack`同一时刻处理多个任务，发挥多核`CPU`电脑的威力以
提升构建速度呢？[thread-loader](https://github.com/webpack-contrib/thread-loader)来帮你，根据CPU
个数开启线程

在此需注意一个问题，若项目文件不算多就不要使用该性能优化建议，毕竟开启多个线程也会存在性能开销。

```js
import Os from "os";

export default {
    // ...
    module: {
        rules: [{
            // ...
            test: /\.js$/,
            use: [{
                loader: "thread-loader",
                options: { workers: Os.cpus().length } // 拿到系统最大CPU核数，灌满整个
            }, {
                loader: "babel-loader",
                options: { cacheDirectory: true }
            }]
        }]
    }
};
```

### 6、可视结构

**配置BundleAnalyzer分析打包文件结构，** 好处是<font color=#FF6A6A>找出体积过大的原因。</font>
从而通过分析原因得出优化方案减少构建时间。<font color=#FF6A6A>BundleAnalyzer</font>是`webpack`官方
插件，可直观分析打包文件的模块组成部分、模块的体积占比、模块包含关系、模块依赖关系、文件是否重复、压缩体积对比等
可视化数据。
可使用[webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) 配置，有了它，我们就能快速找到相关问题。
```js
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

export default {
    // ...
    plugins: [
        // ...
        BundleAnalyzerPlugin()
    ]
};
```

### noParse
如果一些第三方模块没有AMD/CommonJS规范版本，
可以使用 noParse 来标识这个模块，这样 Webpack 会引入这些模块，
但是不进行转化和解析，从而提升 Webpack 的构建性能 ，例如：jquery 、lodash。
```js
//webpack.config.js
module.exports = {
    //...
    module: {
        noParse: /jquery|lodash/
    }
}
```

### IgnorePlugin

`webpack` 的内置插件，作用是忽略第三方包指定目录。

例如: `moment (2.24.0版本)` 会将所有本地化内容和核心功能一起打包，
我们就可以使用 `IgnorePlugin` 在打包时忽略本地化内容。

```js
//webpack.config.js
module.exports = {
    //...
    plugins: [
        //忽略 moment 下的 ./locale 目录
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ]
}
```

在使用的时候，如果我们需要指定语言，那么需要我们手动的去引入语言包，例如，引入中文语言包:

```js
import moment from 'moment';
import 'moment/locale/zh-cn';// 手动引入
```
`index.js` 中只引入 `moment`，
打包出来的 `bundle.js` 大小为 263KB，
如果配置了 `IgnorePlugin`，单独引入 `moment/locale/zh-cn`，构建出来的包大小为 55KB。

## 减少打包体积  分割代码 摇树优化 动态垫片 按需加载 作用提升 压缩资源

### 1、分割代码
**分割各个模块代码，提取相同部分代码，，** 好处是 <font color=#FF6A6A>减少重复代卖出现的频率。</font>
splitChunks配置较多，详情可参考[官网](https://webpack.docschina.org/configuration/optimization/#optimizationsplitchunks)，在此贴上常用配置。
```js
export default {
    // ...
    optimization: {
        runtimeChunk: { name: "manifest" }, // 抽离WebpackRuntime函数
        splitChunks: {
            cacheGroups: {
                common: {
                    minChunks: 2,
                    name: "common",
                    priority: 5,
                    reuseExistingChunk: true, // 重用已存在代码块
                    test: AbsPath("src")
                },
                vendor: {
                    chunks: "initial", // 代码分割类型
                    name: "vendor", // 代码块名称
                    priority: 10, // 优先级
                    test: /node_modules/ // 校验文件正则表达式
                }
            }, // 缓存组
            chunks: "all" // 代码分割类型：all全部模块，async异步模块，initial入口模块
        } // 代码块分割
    }
};
```
### 2、摇树优化
**删除项目中未被引用的代码，** 好处是<font color=#FF6A6A>移除重复代码和未使用的代码</font>。摇树优化首次出现在
rollup，是rollup的核心观念。后来从webpack2借鉴了过来。

<font color=#FF6A6A>摇树优化</font>只对<font color=#FF6A6A>ESM规范</font>生效，对其他模块规范失效。
摇树优化针对静态结构分析，只有`import/export`才能提供静态的导入/导出功能。因此在编写业务代码时必须使用ESM规范
才能让摇树优化移除重复代码和未使用的代码。

在webpack里只需将打包环境设置成生产环境就能让摇树优化生效，
同时业务代码使用ESM规范编写，使用import导入模块，使用export导出模块。
```js
export default {
    // ...
    mode: "production"
};
```
### 3、动态垫片
**通过垫片服务根据UA返回当前浏览器代码垫片**，好处是<font color=#FF6A6A>无需将繁重的代码垫片打包进去。</font>
每次构建都配置`@babel/preset-env`和`core-js`根据某些需求将`Polyfill`打包进来，这无疑又为代码体积增加了贡献。
`@babel/preset-env`提供的`useBuiltIns`可按需导入`Polyfill`。
 - false：无视`target.browsers`将所有`Polyfill`加载进来
 - entry：根据`target.browsers`将部分`Polyfill`加载进来(仅引入有浏览器不支持的Polyfill，需在入口文件`import "core-js/stable"`)
 - usage：根据`target.browsers`和检测代码里ES6的使用情况将部分`Polyfill`加载进来(无需在入口文件`import "core-js/stable"`)

在此推荐大家使用**动态垫片**。动态垫片可根据浏览器UserAgent返回当前浏览器Polyfill，
其思路是根据浏览器的`UserAgent`从`browserlist`
查找出当前浏览器哪些特性缺乏支持从而返回这些特性的Polyfill。
对这方面感兴趣的同学可参考[polyfill-library](https://github.com/Financial-Times/polyfill-library) 和 [polyfill-service](https://github.com/Financial-Times/polyfill-service) 的源码。
在此提供两个动态垫片服务，可在不同浏览器里点击以下链接看看输出不同的Polyfill。
相信IExplore还是最多Polyfill的，它自豪地说：我就是我，不一样的烟火。

官方CDN服务：https://polyfill.io/v3/polyfill.min.js
阿里CDN服务：https://polyfill.alicdn.com/polyfill.min.js

使用[html-webpack-tags-plugin](https://github.com/jharris4/html-webpack-tags-plugin) 在打包时自动插入**动态垫片**。
```js
import HtmlTagsPlugin from "html-webpack-tags-plugin";

export default {
    plugins: [
        new HtmlTagsPlugin({
            append: false, // 在生成资源后插入
            publicPath: false, // 使用公共路径
            tags: ["https://polyfill.alicdn.com/polyfill.min.js"] // 资源路径
        })
    ]
};
```
### 4、按需加载
**将路由页面/触发性功能单独打包为一个文件，使用时才加载，** 好处是<font color=#FF6A6A>减轻首屏渲染的负担</font>。
因为项目功能越多其打包体积越大，导致首屏渲染速度越慢。

首屏渲染时只需对应**JS代码**而无需其他JS代码，所以可使用**按需加载**。
webpack v4提供模块按需切割加载功能，配合import()可做到首屏渲染减包的效果，
从而加快首屏渲染速度。只有当触发某些功能时才会加载当前功能的JS代码。

`webpack v4`提供魔术注解命名**切割模块**，
若无注解则切割出来的模块无法分辨出属于哪个业务模块，
所以一般都是一个业务模块共用一个<font color=#FF6A6A>切割模块</font>
的注解名称。
```js
const Login = () => import( /* webpackChunkName: "login" */ "../../views/login");
const Logon = () => import( /* webpackChunkName: "logon" */ "../../views/logon");
```
运行起来控制台可能会报错，在`package.json`的`babel`相关配置里接入[@babel/plugin-syntax-dynamic-import](https://babeljs.io/docs/en/babel-plugin-syntax-dynamic-import.html) 即可。
```json
{
    // ...
    "babel": {
        // ...
        "plugins": [
            // ...
            "@babel/plugins-syntax-dynamic-import"
        ]
    }
}
```
### 5、作用提升

**分析模块间依赖关系，把打包好的模块合并到一个函数中**，好处是<font color=#FF6A6A>减少函数声明和内存花销。</font>
作用提升首次出现于`rollup`，是`rollup`的核心概念，后来在`webpack v3`里借鉴过来使用。

在未开启<font color=#FF6A6A>作用提升</font>
前，构建后的代码会存在大量函数闭包。
由于模块依赖，通过`webpack`打包后会转换成`IIFE`，大量函数闭包包裹代码会导致打包体积增大
(<font color=#FF6A6A>模块越多越明显</font>)。
在运行代码时创建的函数作用域变多，从而导致更大的内存开销。

在开启<font color=#FF6A6A>作用提升</font>后，构建后的代码会按照引入顺序放到一个函数作用域里，
通过适当重命名某些变量以防止变量名冲突，从而减少函数声明和内存花销。

在`webpack`里只需将打包环境设置成生产环境就能让作用提升生效，或显式设置`concatenateModules`。
```js
export default {
    // ...
    mode: "production"
};
// 显式设置
export default {
    // ...
    optimization: {
        // ...
        concatenateModules: true
    }
};
```

### 6、压缩资源
**压缩HTML/CSS/JS代码，压缩字体/图像/音频/视频**，好处是<font color=#FF6A6A>更有效减少打包体积</font>。
极致地优化代码都有可能不及优化一个资源文件的体积更有效。
[html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)
```js
// 压缩html
import HtmlPlugin from "html-webpack-plugin";

export default {
    // ...
    plugins: [
        // ...
        HtmlPlugin({
            // ...
            minify: {
                collapseWhitespace: true,
                removeComments: true
            } // 压缩HTML
        })
    ]
};
```
针对`CSS/JS`代码，分别使用以下插件开启压缩功能。
其中`OptimizeCss`基于`cssnano`封装，`Uglifyjs`和`Terser`都是`webpack`官方插件，
同时需注意压缩JS代码需区分ES5和ES6。

- [optimize-css-assets-webpack-plugin](https://github.com/NMFR/optimize-css-assets-webpack-plugin)：压缩CSS代码
- [uglifyjs-webpack-plugin](https://github.com/webpack-contrib/uglifyjs-webpack-plugin)：压缩ES5版本的JS代码
- [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin)：压缩ES6版本的JS代码
```js
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugins";
import TerserPlugin from "terser-webpack-plugins";
import UglifyjsPlugin from "uglifyjs-webpack-plugins";

const compressOpts = type => ({
    cache: true, // 缓存文件
    parallel: true, // 并行处理
    [`${type}Options`]: {
        beautify: false,
        compress: { drop_console: true }
    } // 压缩配置
});
const compressCss = new OptimizeCssAssetsPlugin({
    cssProcessorOptions: {
        autoprefixer: { remove: false }, // 设置autoprefixer保留过时样式
        safe: true // 避免cssnano重新计算z-index
    }
});
const compressJs = USE_ES6
    ? new TerserPlugin(compressOpts("terser"))
    : new UglifyjsPlugin(compressOpts("uglify"));

export default {
    // ...
    optimization: {
        // ...
        minimizer: [compressCss, compressJs] // 代码压缩
    }
};
```
[图片压缩](https://tinypng.com/)
[tinyimg-webpack-plugin](https://github.com/JowayYoung/tinyimg-webpack-plugin)
```js
import TinyimgPlugin from "tinyimg-webpack-plugins";

export default {
    // ...
    plugins: [
        // ...
        TinyimgPlugin()
    ]
};
```


## webpack结构
compiler 对象代表了完整的 webpack 环境配置。这个对象在启动 webpack 时被一次性建立，并配置好所有可操作的设置，包括 options，loader 和 plugin。当在 webpack 环境中应用一个插件时，插件将收到此 compiler 对象的引用。可以使用它来访问 webpack 的主环境。

compilation 对象代表了一次资源版本构建。当运行 webpack 开发环境中间件时，每当检测到一个文件变化，就会创建一个新的 compilation，从而生成一组新的编译资源。一个 compilation 对象表现了当前的模块资源、编译生成资源、变化的文件、以及被跟踪依赖的状态信息。compilation 对象也提供了很多关键步骤的回调，以供插件做自定义处理时选择使用。

```
创建 Compiler -> 
调用 compiler.run 开始构建 ->
创建 Compilation -> 
基于配置开始创建 Chunk -> 
使用 Parser 从 Chunk 开始解析依赖 -> 
使用 Module 和 Dependency 管理代码模块相互关系 -> 
使用 Template 基于 Compilation 的数据生成结果代码 ->
```
