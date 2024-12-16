import { ShapeFlags } from "packages/shared/src/shapeFlags";
import { isString } from "@mini-vue/shared";
type VNode = {
  __v_isVNode: true; //需要标记一下用于后续判断是否为虚拟节点
  type: string | typeof Function;
  props: object | null;
  children: string | Array<VNode>;
  shapeFlag: number;
  key: undefined | string;
  el: null | HTMLElement; //需要将元素挂载到虚拟节点上后续方便移除
};
export function isVNode(obj: any): boolean {
  return obj.__v_isVNode;
}
export function createVNode(type: any, props: any, children?: any): VNode {
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
  //如果children是文本需要改变shapeFlag
  if (children) {
    if (Array.isArray(children)) {
      shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else {
      children = String(children); //可能会有数字都转成字符串
      shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }
  return {
    __v_isVNode: true, //需要标记一下用于后续判断是否为虚拟节点
    type,
    props,
    children,
    shapeFlag,
    key: props?.key,
    el: null, //需要将元素挂载到虚拟节点上后续方便移除
  };
}
