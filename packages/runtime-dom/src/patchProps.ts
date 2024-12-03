import patchAttr from "./modules/patchAttr";
import patchClass from "./modules/patchClass";
import patchEvent from "./modules/patchEvent";
import patchStyle from "./modules/patchStyle";

//用来处理dom class style event
export default function patchProps(
  el: HTMLElement,
  key: string,
  preValue: any,
  nextValue: any
) {
  //根据不同的key处理
  if (key === "class") {
    return patchClass(el, nextValue);
  } else if (key === "style") {
    return patchStyle(el, preValue, nextValue);
  } else if (/^on[A-Z]/.test(key)) {
    return patchEvent(el, key as `on${keyof HTMLElementEventMap}`, nextValue);
  } else {
    return patchAttr(el, key, nextValue);
  }
}
