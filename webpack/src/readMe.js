import md from '../README.md';

function readMe() {
  console.log('md', md);

  const element = document.createElement('div');
  element.innerText = '我就是来看看'
  const btn = document.createElement('div');
  btn.innerHTML = md
  element.appendChild(btn)
  return element;
}

document.body.appendChild(readMe());
