export default function patchAttr(el: HTMLElement, key: string, value: string) {
  if (value === null) {
    //如果当前是空就将之前的全部移除
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}
