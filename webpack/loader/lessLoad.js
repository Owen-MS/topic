#!/usr/bin/env node


const less = require('less');

module.exports = function (content, map, meta) {
  const callback = this.async();
  // Less 的编译调用是异步的
  less.render(content, { sourceMap: {} }, (error, output) => {
    if (error) callback(error); // 抛出异常

    console.log(8999, output);
    // 正常返回
    callback(null, output.css, output.map, meta);
  });
};
