export default function patchClass(el: HTMLElement, value: string) {
  //如果是新的则全部生效
  if (value === null) {
    el.removeAttribute("class");
  } else {
    el.className = value;
  }
}
