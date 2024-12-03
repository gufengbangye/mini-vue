export default function patchStyle(el: HTMLElement, prev: any, next: any) {
  const style = el.style;
  if (next) {
    for (let key in next) {
      style[key as any] = next[key];
    }
  }
  if (prev) {
    for (let key in prev) {
      if (next[key] == null) {
        style[key as any] = "";
      }
    }
  }
}
