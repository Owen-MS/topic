# 当面试官问webpack的时候他想知道什么

## 如何编写一个[Loader](https://www.webpackjs.com/api/loaders/)

首先Loader支持链式调用，所以开发上需要严格遵循"单一职责"，每个Loader只负责自己需要负责的事情。

### 解释loader
所谓loader只是一个导出为函数的JavaScript模块。loader runner会调用这个函数，然后把上一个loader
产生的结果或者资源文件（resource file）文件传入进去。

函数的`this`上下文将由webpack填充，并且`loader runner` 具有一些有用的方法，可以使`loader`改变
为异步调用方式，或者获取`query`参数。


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
// async-loader.js
module.exports = function(content, map, meta) {
  var callback = this.async();
  someAsyncOperation(content, function(err, result) {
    if (err) return callback(err);
    callback(null, result, map, meta);
  });
};
```
```js
// async-loader-with-multiple-results.js
module.exports = function(content, map, meta) {
  var callback = this.async();
  someAsyncOperation(content, function(err, result, sourceMaps, meta) {
    if (err) return callback(err);
    callback(null, result, sourceMaps, meta);
  });
};
```

