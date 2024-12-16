export interface RenderOptions {
  insert: (
    el: HTMLElement,
    parent: HTMLElement,
    anchor: HTMLElement | null
  ) => void;
  remove: (el: HTMLElement) => void;
  createElement: (type: keyof HTMLElementTagNameMap) => HTMLElement;
  createText: (text: string) => Text;
  setText: (node: Text, text: string) => void;
  setElementText: (el: HTMLElement, text: string) => void;
  patchProp: (
    el: HTMLElement,
    key: string,
    preValue: any,
    nextValue: any
  ) => void;
  nextSibling: (node: HTMLElement) => Node | null;
}
