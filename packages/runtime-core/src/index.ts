export * from "@mini-vue/reactivity";
import { ShapeFlags } from "packages/shared/src/shapeFlags";
import { isSameVNode, VNode } from "./createVNode";
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
  const mountElement = (
    n1: VNode,
    container: HTMLElement,
    anchor: null | HTMLElement
  ) => {
    const { type, props, children, shapeFlag } = n1;
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
    hostInsert(el, container, anchor);
  };
  //移除节点
  const unmount = (vNode: VNode) => {
    const el = vNode.el;
    el && hostRemove(el);
  };

  const patchProps = (
    oldProps: Record<string, any>,
    newProps: Record<string, any>,
    el: HTMLElement
  ) => {
    //对比新老props新的全部生效
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    //老的并且不在新的则删除
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };
  const unmountChildren = (vNode: any) => {
    for (let i = 0; i < vNode.length; i++) {
      unmount(vNode[i]);
    }
  };
  //n1是旧的儿子
  //n2是新的儿子
  const patchKeyChildren = (c1: any, c2: any, el: HTMLElement) => {
    debugger;
    //从头部开始比较
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    //[a,b]
    //[a,b,c,e]
    //只要i长度大于其中一个就跳出
    while (i <= e1 && i <= e2) {
      //只比较到相同的位置没有就跳出
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNode(n1, n2)) {
        //一样就更新
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    //从尾部开始一一比较
    //[k,c,e]
    //[a,b,c,e]
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNode(n1, n2)) {
        //一样就更新
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    console.log(i, e1, e2);
    //[b,c,e] [a,b,c,e]
    //i = 0 e1 = -1 e2>0
    if (i > e1) {
      while (i <= e2) {
        //新增
        //由于有的时候为头部新增节点，所以需要知道后一个节点
        const anchor = c2[i + 1]?.el;
        patch(null, c2[i], el, anchor);
        i++;
      }
    } else if (i > e2) {
      //删除
      //新节点比较少删除
      while (i <= e1) {
        //删除
        unmount(c1[i]);
        i++;
      }
    } else {
      //因为要新老节点做对比所以需要将新节点或者旧节点其中一个做map
      let s1 = i;
      let s2 = i;
      const keyToNewIdexMap = new Map();
      // //用于存放新节点对应的key例如
      // const ele = h(
      //   "div",
      //   { key: 1, style: { color: "blue", fontSize: "16px" }, abc: 123 },
      //   [
      //     h("div", { key: "a" }, "a"),
      //     h("div", { key: "b", style: { color: "pink" } }, "b"),
      //     h("div", { key: "c" }, "c"),
      //     h("div", { key: "d" }, "d"),
      //     h("div", { key: "e" }, "e"),
      //     h("div", { key: "f" }, "f"),
      //     h("div", { key: "g" }, "g"),
      //   ]
      // );
      // const ele1 = h("div", { key: 1, style: { color: "pink" } }, [
      //   h("div", { key: "a" }, "a"),
      //   h("div", { key: "b", style: { color: "yellow" } }, "b"),
      //   h("div", { key: "e" }, "e"),
      //   h("div", { key: "c" }, "c"),
      //   h("div", { key: "d" }, "d"),
      //   h("div", { key: "h" }, "h"),
      //   h("div", { key: "f" }, "f"),
      //   h("div", { key: "g" }, "g"),
      // ]);
      //就是将中间的ecdh做成map 后续通过判断key在不在这个map里去决定是更新还是新增
      for (let i = s2; i <= e2; i++) {
        const key = c2[i].key;
        keyToNewIdexMap.set(key, i);
      }
      for (let i = s1; i <= e1; i++) {
        //如果相同的key在新的那就更新
        const key = c1[i].key;
        if (keyToNewIdexMap.has(key)) {
          const index = keyToNewIdexMap.get(key);
          patch(c1[i], c2[index], el);
        } else {
          //不在就移除
          unmount(c1[i]);
        }
      }
      //调整顺序，因为插入可能是中间的元素 浏览器又没有提供插入一个元素后面的api所以需要倒序插入
      const toPatchedLength = e2 - s2 + 1; //新老的长度差 需要倒序插入的个数
      for (let i = toPatchedLength - 1; i > 0; i--) {
        //需要倒序插入
        const newIndex = i + s2; //
        //判断当前有没有渲染过 没有渲染就渲染一遍
        const vNode = c2[i + s2];
        const anchor = c2[newIndex + 1]?.el;
        if (!vNode.el) {
          patch(null, vNode, el, anchor); //渲染
        } else {
          hostInsert(vNode.el, el, anchor); //插入
        }
        //渲染过就插入
      }
    }
  };
  const patchChildren = (n1: VNode, n2: VNode, el: HTMLElement) => {
    //分为几点情况
    //新的是文本节点旧的是文本节点
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    //获取新的虚拟节点的shapeFlag 子元素如果是文本节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //如果是旧的则将之前删除然后把新的文本放进去
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }
      //如果旧的是文本节点就替换
      if (c1 !== c2) {
        hostSetElementText(el, c2 as string);
      }
    } else {
      //旧的是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          //数组diff
          console.log("数组diff");
          patchKeyChildren(c1, c2, el);
        } else {
          //不是数组就都删除
          unmountChildren(n1);
        }
      } else {
        //旧的是文本节点
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, "");
        }
        //新的是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };
  const patchElement = (n1: VNode, n2: VNode, container: HTMLElement) => {
    //由于新的虚拟节点上是没有el的所以先赋值一下
    const el = (n2.el = n1.el);
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    //对比props
    patchProps(oldProps, newProps, el!);
    //对比子节点
    patchChildren(n1, n2, el!);
  };
  //n1是上一次节点 n2是当前节点
  const patch = (
    n1: VNode | null,
    n2: VNode,
    container: HTMLElement,
    anchor = null
  ) => {
    if (n1 === n2) return; // 如果一样就不更新

    //如果不一样就将之前的移除然后将新的渲染
    if (n1 && !isSameVNode(n1, n2)) {
      //如果是不一样的就进来
      console.log("进来了");
      unmount(n1);
      n1 = null;
    }

    if (n1 === null) {
      //如果没有前值 就表示是初始化直接渲染
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2, container); //如果n1和n2是一种类型并且key一样则做diff更新
    }
  };
  const render = (
    vNode: VNode,
    container: HTMLElement & {
      _vNode?: VNode;
    }
  ) => {
    console.log(vNode, container);
    if (vNode === null) {
      //移除当前节点
      //所以需要将el挂载在虚拟节点上
      container._vNode && unmount(container._vNode);
      return;
    }
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
