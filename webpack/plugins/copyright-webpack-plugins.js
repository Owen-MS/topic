class CopyrightWebpackPlugins {
  //编写一个构造器
  constructor(options) {
    console.log(options)
  }

  apply(compiler) {
    //遇到同步时刻 // 一个新的编译创建之后，
    compiler.hooks.compile.tap('CopyrightWebpackPlugin',() => {
      console.log('compiler');
    });

    //遇到异步时刻
    //当要把代码放到dist目录之前，要走下面这个函数
    //Compilation存放打包的所有内容，Compilation.assets放置生成的内容
    compiler.hooks.emit.tapAsync('CopyrightWebpackPlugin', (Compilation, cb) => {
      debugger;
      // 往代码中增加一个文件，copyright.txt
      Compilation.assets['copyright.txt'] = {
        source: function() {
          return 'copyright by monday';
        },
        size: function() {
          return 19;
        }
      };
      cb();
    })
  }
}

module.exports = CopyrightWebpackPlugins;
