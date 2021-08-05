#!/usr/bin/env node

const marked = require("marked");
const loaderUtils = require("loader-utils");

module.exports = function (markdown) {
  // merge params and default config
  const options = loaderUtils.getOptions(this);

  // 设置是否可缓存标志的函数，
  // 默认情况下，loader 的处理结果会被标记为可缓存。调用这个方法然后传入 false，可以关闭 loader 的缓存
  // this.cacheable();

  // marked.setOptions(options);


  const str = options.name + marked(markdown);
  console.log(33356, markdown, str);
  // 使用 marked 处理 markdown 字符串，然后以 JS Module 的方式导出，返回最终的 JS 代码
  // return `export default \`${str}\`;`;
  this.callback(null, `export default \`${str}\`;`);
  // return marked(markdown);
};
