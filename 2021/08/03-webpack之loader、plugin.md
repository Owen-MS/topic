# 当面试官问webpack的时候他想知道什么


## 打包流程
![构建流程](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/5/18/172256efb94eec6d~tplv-t2oaga2asx-zoom-crop-mark:1304:0:0:0.awebp)
1. 初始化参数：从配置文件和`shell`语句中读取与合并参数，得出最终的参数。
2. 开始编译：用上一步得到的参数初始化`Compiler`对象，加载所有配置的插件，执行对象的run方法开始执行编译
3. 确定入口：根据配置的`entry`找出所有的入口文件
4. 编译模块：从入口文件出发，调用所有配置的Loader对模块进行翻译，再找出该模块依赖的模块，再递归
本步骤直到所有入口依赖的文件都经过了本步骤的处理。
5. 完成模块编译：在经过第4步使用Loader翻译完所有模块后，得到了每个模块被翻译后的最终内容以及他们之间
的依赖关系。
6. 输出资源：根据入口和模块之间的依赖关系，组装成一个个包含多个模块的Chunk，再把每个Chunk转换成一个
单独的文件加入到输出列表。这步可以修改输出内容最后的机会。
7. 输出完成：在确定好输出内容后，根据配置确定输出的路径和文件名，把文件内容写入到文件系统

**简单来说**
- 初始化：启动构建，读取与合并配置参数，加载Plugin，实例化Compiler
- 编译：从Entry出发，针对每个Module串行调用对应的Loader去翻译文件的内容，再找到该Module依赖的
Module，递归地进行编译处理。
- 输出：将编译后的Module组合成Chunk，将Chunk转换成文件，输出到文件系统中，

## 如何编写一个[Loader](https://www.webpackjs.com/api/loaders/)

首先Loader支持链式调用，所以开发上需要严格遵循"单一职责"，每个Loader只负责自己需要负责的事情。

### 解释loader

所谓loader只是一个导出为函数的JavaScript模块。loader runner会调用这个函数，然后把上一个loader
产生的结果或者资源文件（resource file）文件传入进去。

第一个 loader 的传入参数只有一个：
资源文件(resource file)的内容。
compiler 需要得到最后一个 loader 产生的处理结果。
这个处理结果应该是 String 或者 Buffer（被转换为一个 string），
代表了模块的 JavaScript 源码。
另外还可以传递一个可选的 SourceMap 结果（格式为 JSON 对象）。



首先 `loader` 函数接受的参数是有三个的：`content, map, meta`。
`content` 是模块内容，但不仅限于字符串，也可以是 [buffer](http://nodejs.cn/api/buffer.html)，
例如一些图片或者字体等文件。
`map` 则是 `sourcemap` 对象，
`meta` 是其他的一些元数据。
`loader` 函数单纯返回一个值，这个值是当成 `content` 去处理，
但如果你需要返回 `sourcemap` 对象或者 `meta` 数据，甚至是抛出一个 `loader` 异常给 
`webpack` 时，你需要使用 `this.callback(err, content, map, meta)` 来传递这些数据。

#### 同步load
无论是 `return` 还是 `this.callback` 都可以同步地返回转换后的 `content` 内容：

```js
// sync-loader.js
module.exports = function(content, map, meta) {
  return someSyncOperation(content);
};
```
`this.callback` 方法则更灵活，因为它允许传递多个参数，而不仅仅是`content`。

```js
// sync-loader-with-multiple-results.js
module.exports = function(content, map, meta) {
  this.callback(null, someSyncOperation(content), map, meta);
  return; // 当调用 callback() 时总是返回 undefined
};
```

#### 异步loader
对于异步 loader，使用 this.async 来获取 callback 函数：

```js

const loaderUtils = require("loader-utils");

// async-loader-with-multiple-results.js
module.exports = function(content, map, meta) {
  var callback = this.async();
  const options = loaderUtils.getOptions(this);
  someAsyncOperation(content, function(err, result, sourceMaps, meta) {
    if (err) return callback(err);
    callback(null, result, sourceMaps, meta);
  });
};
```

上文用到的 [loader-utils](https://github.com/webpack/loader-utils) 是 `webpack` 官方提供的一个工具库，
提供 `loader` 处理时需要用到的一些工具方法，例如用来解析上下文 `loader` 配置项的 `getOptions`。

## 如何编写一个plugin

`plugin`的实现可以是一个类，使用时传入相关配置来创建一个实例，然后放到配置的`plugins`字段中，而`pligin`
实例中最重要的方法是`apply`，该方法在`webpack compiler`安装插件时会被调用一次，而`apply`接受
`webpack compiler`对象实例的引用，你可以在`compiler`对象实例上注册各种事件钩子函数，来影响
`webpack`所有构建流程，以便完成更多其他的构建任务。

`事件钩子可以理解为当webpack运行中执行某个钩子的状态时，便会触发你注册的事件，即发布订阅模式。`

```js
this.hooks = {
  shouldEmit: new SyncBailHook(["compilation"]), // 这里的声明的事件钩子函数接收的参数是 compilation，
  done: new AsyncSeriesHook(["stats"]), // 这里接收的参数是 stats，以此类推
	additionalPass: new AsyncSeriesHook([]),
	beforeRun: new AsyncSeriesHook(["compilation"]),
  run: new AsyncSeriesHook(["compilation"]),
  emit: new AsyncSeriesHook(["compilation"]),
	afterEmit: new AsyncSeriesHook(["compilation"]),
	thisCompilation: new SyncHook(["compilation", "params"]),
  // ...
};
```

```js
class FlowPlugin {
  apply(compiler) {
    compiler.hooks.entryOption.tap('FlowPlugin', (context, entry) => {
      // entry 配置被 webpack 处理好之后触发
      // console.log(`entryOption: ${entry}`);
    });

    compiler.hooks.beforeRun.tap('FlowPlugin', (compiler) => {
      // compiler 执行之前触发
      // 可以从参数 compiler 读取到执行前的整个编译器状态
      // console.log(compiler.options.plugins);
    });

    compiler.hooks.compilation.tap('FlowPlugin', (compilation) => {
      // 构建需要的 compilation 对象创建之后，可以从参数获取 compilation 读取到该次构建的基础状态
      // 通常 compilation 的 hooks 绑定一般也在该阶段处理
      // console.log(compilation);

      compilation.hooks.buildModule.tap('FlowPlugin', (module) => {
        // 一个模块开始构建之前，可以用于修改模块信息
        // 模块代码内容的转换依旧是应该 loader 来处理，plugin 着眼于其他信息的调整或获取
        // console.log(module);
      });

      compilation.hooks.finishModules.tap('FlowPlugin', (modules) => {
        // 所有模块都被成功构建时执行，可以获取所有模块的相关信息
        // console.log(modules);
      });

      compilation.hooks.chunkAsset.tap('FlowPlugin', (chunk, filename) => {
        // chunk 对应的一个输出资源添加到 compilation 时执行，可以获取 chunk 对应输出内容信息
        // module 也有 moduleAsset，但实际使用 chunk 会更多
        // console.log(chunk, '\n', filename);
      });
    });

    compiler.hooks.make.tap('FlowPlugin', (compilation) => {
      // compilation 完成编译后执行，可以从参数查看 compilation 完成一次编译后的状态
      // console.log(compilation);
    });

    compiler.hooks.shouldEmit.tap('FlowPlugin', (compilation) => {
      // 在输出构建结果前执行，可以通过该 hook 返回 true/false 来控制是否输出对应的构建结果
      return true;
    });

    compiler.hooks.assetEmitted.tap(
      'FlowPlugin',
      (file, content) => {
        // 在构建结果输出之后执行，可以获取输出内容的相关信息
        // console.log(content);
      }
    );

    compiler.hooks.done.tap('FlowPlugin', (stats) => {
      // 完成一次构建后执行，可以输出构建执行结果信息
      // console.log(stats);
    });

    compiler.hooks.failed.tap('FlowPlugin', (error) => {
      // 构建失败时执行，用于获取异常进行处理
      // console.log(error);
    });
  }
}

module.exports = FlowPlugin;
```

### compiler
Compiler 对象包含了当前运行Webpack的配置，
包括entry、output、loaders等配置，
这个对象在启动Webpack时被实例化，而且是全局唯一的。
Plugin可以通过该对象获取到Webpack的配置信息进行处理。
![compiler](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/5/18/1722383f628b467a~tplv-t2oaga2asx-zoom-crop-mark:1304:0:0:0.awebp)


### compilation (负责创建bundles)
Compilation对象代表了一次资源版本构建。
当运行 webpack 开发环境中间件时，每当检测到一个文件变化，
就会创建一个新的 compilation，从而生成一组新的编译资源。
一个 Compilation 对象表现了当前的模块资源、编译生成资源、变化的文件、
以及被跟踪依赖的状态信息，简单来讲就是把本次打包编译的内容存到内存里。
Compilation 对象也提供了插件需要自定义功能的回调，以供插件做自定义处理时选择使用拓展。
![compilation](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/5/18/1722383f6029862f~tplv-t2oaga2asx-zoom-crop-mark:1304:0:0:0.awebp)


### Compiler 和 Compilation 的区别

Compiler 代表了整个 Webpack 从启动到关闭的生命周期，
而 Compilation 只是代表了一次新的编译，只要文件有改动，compilation就会被重新创建。
