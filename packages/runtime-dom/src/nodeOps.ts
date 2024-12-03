//节点操作
export default {
  //插入节点
  insert: (el: HTMLElement, parent: HTMLElement, anchor: HTMLElement) => {
    parent.insertBefore(el, anchor || null);
    //如果anchor为null则插入到末尾 即等同于parent.appendChild(el)
  },
  //移除节点
  remove: (el: HTMLElement) => {
    const parent = el.parentNode;
    parent && parent.removeChild(el);
  },
  //创建元素
  createElement: (type: keyof HTMLElementTagNameMap) =>
    document.createElement(type),
  //创建文本
  createText: (type: string) => document.createTextNode(type),
  //设置文本
  setText: (node: HTMLElement, text: string) => (node.nodeValue = text),
  //设置元素文本
  setElementText: (node: HTMLElement, text: string) =>
    (node.textContent = text),
  //获取父节点
  parentNode: (node: HTMLElement) => node.parentNode,
  //获取下一个兄弟节点
  nextSibling: (node: HTMLElement) => node.nextSibling,
};
