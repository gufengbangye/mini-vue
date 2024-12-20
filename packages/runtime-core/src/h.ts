import { isObject } from "@mini-vue/shared";
import { createVNode, isVNode, VNode } from "./createVNode";
// 可以是一个参数，2个参数(类型，属性/儿子)  3个(标准的)超过3个(从第三个开始都是儿子)
// h(类型，属性，儿子》
// h(类型，儿子)
//1.两个参数 第二个参致可能是属性，或者虚拟节点(v_isVnode)
//2.第二个参数就是一个数组 -> 儿子
//3.其他情况就是属性
//4.直接传递非对象的，文本
//5.出现三个参数的时候第二个只能是属性，
//6.如果超过三个参数，后面的都是儿子
export function h(type: string, props: any): VNode;
export function h(type: string, children: any[]): VNode;
export function h(type: string, child: VNode): VNode;
export function h(
  type: string,
  props: any,
  children: VNode | any[] | any
): VNode;
export function h(
  type: string,
  props: object,
  children: [],
  ...args: any[]
): VNode;
export function h(type: string, propsOrChildren: any, children?: any): VNode {
  const l = arguments.length;
  if (l === 2) {
    // 2个参数
    if (isObject(propsOrChildren)) {
      if (Array.isArray(propsOrChildren)) {
        //如果是数组就都是儿子
        //h('div', [h('span', 'hello')])
        return createVNode(type, null, propsOrChildren);
      } else {
        if (isVNode(propsOrChildren)) {
          //h('div', h('div'))
          return createVNode(type, null, propsOrChildren);
        } else {
          //h('div', {style:{color:pink}})
          return createVNode(type, propsOrChildren);
        }
      }
    }
    return createVNode(type, null, propsOrChildren);
  } else {
    if (l === 3 && isVNode(children)) {
      //h('div',{style:{color:pink}},h('div','hello'))
      return createVNode(type, propsOrChildren, [children]);
    }
    if (l > 3) {
      //h('div',{},'1','2','3')
      children = Array.from(arguments).slice(2);
      return createVNode(type, propsOrChildren, [children]);
    }
    //第二个只能是属性
  }
  return createVNode(type, propsOrChildren, children);
}
