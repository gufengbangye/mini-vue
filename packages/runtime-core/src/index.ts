export * from "@mini-vue/reactivity";
import { ShapeFlags } from "packages/shared/src/shapeFlags";

export interface RenderOptions {
  insert: (
    el: HTMLElement,
    parent: HTMLElement,
    anchor: HTMLElement | null
  ) => void;
  remove: (el: HTMLElement) => void;
  createElement: (type: keyof HTMLElementTagNameMap) => HTMLElement;
  createText: (text: string) => Text;
  setText: (node: HTMLElement, text: string) => void;
  setElementText: (el: HTMLElement, text: string) => void;
  patchProp: (
    el: HTMLElement,
    key: string,
    preValue: any,
    nextValue: any
  ) => void;
  nextSibling: (node: HTMLElement) => Node | null;
  parentNode: (node: HTMLElement) => Node | null;
}

type vNode = {
  type: string;
  shapeFlag: number;
  key: any;
  props: Record<string, any>;
  children: any;
};
const patch = (n1: vNode, container: HTMLElement) => {};
export const createRenderer = (options: RenderOptions) => {
  const {
    createElement: hostCreateElement,
    createText: hostCreateText,
    insert: hostInsert,
    nextSibling: hostNextSibling,
    parentNode: hostParentNode,
    remove: hostRemove,
    patchProp: hostPatchProp,
    setElementText: hostSetElementText,
    setText: hostSetText,
  } = options;
  //渲染子元素
  const mountChildren = (children: any, container: HTMLElement) => {
    for (let i = 0; i < children.length; i++) {
      console.log(children[i], "child");
      patch(null, children[i], container);
    }
  };
  //将虚拟对象渲染到页面上
  const mountElement = (n1: vNode, container: HTMLElement) => {
    const { type, props, children, shapeFlag } = n1;
    console.log(ShapeFlags, "lll");
    // 创建元素
    const el = hostCreateElement(type as keyof HTMLElementTagNameMap);
    if (props) {
      //将属性渲染到props上
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 渲染子元素 使用&运算进行子元素类型的判断
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //子元素为文本
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //子元素为数组
      mountChildren(children, el);
    }

    //插入元素
    hostInsert(el, container, null);
  };
  //n1是上一次节点 n2是当前节点
  const patch = (n1: vNode | null, n2: vNode, container: HTMLElement) => {
    console.log(n1, container);
    if (n1 === n2) return; // 如果一样就不更新
    if (n1 === null) {
      //如果没有前值 就表示是初始化直接渲染
      mountElement(n2, container);
    }
  };
  const render = (
    vNode: vNode,
    container: HTMLElement & {
      _vNode?: vNode;
    }
  ) => {
    console.log(vNode, container);
    //去渲染节点
    patch(container._vNode || null, vNode, container);
    //将vNode放在元素上 用于下次比对
    container._vNode = vNode;
  };
  return {
    render,
  };
};
export * from "./h";
