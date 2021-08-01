# webpack进阶优化思想
## 构建策略
<font color=#FF6A6A></font>
我们在配置webpack的配置以及依据当前项目来做优化配置时，其实都是追寻又快又小。衡量标准那就是，从时间层面和体积层面。
- **减少打包时间：** <font color=#FF6A6A>缩减范围、缓存副本、定向搜索、提前构建、并行构建、可视结构</font>
- **减少打包体积：** <font color=#FF6A6A>分割代码、遥数优化、动态垫片、按需加载、作用提升、压缩资源</font>
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
配置`DLLPlugin`**将第三方依赖提前**


## 减少打包体积 分割代码 摇树优化 动态垫片 按需加载 作用提升 压缩资源

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
            "@babel/plugin-syntax-dynamic-import"
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
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import UglifyjsPlugin from "uglifyjs-webpack-plugin";

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
import TinyimgPlugin from "tinyimg-webpack-plugin";

export default {
    // ...
    plugins: [
        // ...
        TinyimgPlugin()
    ]
};
```


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
