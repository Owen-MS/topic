// import _ from 'loadsh';
// import './style.css';
// import Icon from './assets/l1.jpeg';
// import printMe from './print'
// function component() {
//   const element = document.createElement('div');
//
//   // lodash（目前通过一个 script 引入）对于执行这一行是必需的
//   // lodash 在当前 script 中使用 import 引入
//   element.innerHTML = _.join(['Hello', 'webpack898999'], ' ');
//   element.classList.add('hello');
//
//   const btn = document.createElement('button');
//   btn.innerHTML = 'Click me and check the console!';
//   btn.onclick = printMe;
//
//   // 将图像添加到我们已经存在的 div 中。
//   // const myIcon = new Image();
//   // myIcon.src = Icon;
//   // element.appendChild(myIcon);
//   element.appendChild(btn);
//   return element;
// }
//
// document.body.appendChild(component());
//
// // if (module.hot) {
// //   module.hot.accept('./print.js', function() {
// //     console.log('Accepting the updated printMe module!');
// //     printMe();
// //   })
// // }
import _ from 'loadsh';

function component() {
  const element = document.createElement('div');
  const button = document.createElement('button');
  const br = document.createElement('br');

  button.innerHTML = 'Click me and look at the console!';
  element.innerHTML = _.join(['Hello', 'webpack'], ' ');
  element.appendChild(br);
  element.appendChild(button);

  // Note that because a network request is involved, some indication
  // of loading would need to be shown in a production-level site/app.
  button.onclick = e => import(/* webpackChunkName: "print" */ './print').then(module => {
    const print = module.default;

    print();
  });

  return element;
}

document.body.appendChild(component());
