export * from "@mini-vue/reactivity";
import { ShapeFlags } from "packages/shared/src/shapeFlags";
import { VNode } from "./createVNode";
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

const patch = (n1: VNode, container: HTMLElement) => {};
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
  const mountElement = (n1: VNode, container: HTMLElement) => {
    const { type, props, children, shapeFlag } = n1;
    console.log(ShapeFlags, "lll");
    // 创建元素
    const el = (n1.el = hostCreateElement(type as keyof HTMLElementTagNameMap));
    if (props) {
      //将属性渲染到props上
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 渲染子元素 使用&运算进行子元素类型的判断
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //子元素为文本
      hostSetElementText(el, children as string);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //子元素为数组
      mountChildren(children, el);
    }

    //插入元素
    hostInsert(el, container, null);
  };
  //移除节点
  const unmount = (vNode: VNode) => {
    const el = vNode.el;
    el && hostRemove(el);
  };
  //n1是上一次节点 n2是当前节点
  const patch = (n1: VNode | null, n2: VNode, container: HTMLElement) => {
    if (n1 === n2) return; // 如果一样就不更新
    if (n2 === null) {
      //移除当前节点
      //所以需要将el挂载在虚拟节点上
      unmount(n1!);
    }
    if (n1 === null) {
      //如果没有前值 就表示是初始化直接渲染
      mountElement(n2, container);
    }
  };
  const render = (
    vNode: VNode,
    container: HTMLElement & {
      _vNode?: VNode;
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
