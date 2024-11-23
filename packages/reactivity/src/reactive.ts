import { isObject } from "@mini-vue/shared";
import { baseHandler } from "./baseHandler";
import { ReactiveFlags } from "./constants";
export function reactive(raw: object) {
  if (!isObject(raw)) {
    return;
  }
  return createReactive(raw);
}
const reactiveWeakMap = new WeakMap<object, any>();
function createReactive<T extends object>(
  obj: T & {
    [ReactiveFlags.IS_REACTIVE]?: boolean;
  }
): T {
  //需要代理该对象
  if (reactiveWeakMap.has(obj)) {
    //如果该对象被代理过则返回之前的代理对象
    return reactiveWeakMap.get(obj);
  }
  if (obj[ReactiveFlags.IS_REACTIVE]) {
    return obj;
  }
  //   如果改对象已经是代理过的对象就直接返回
  const result = new Proxy(obj, baseHandler) as T;
  //因为对象如果被代理需要返回上一次代理的对象所以需要在每一次将代理对象存到map里如果有就直接返回
  reactiveWeakMap.set(obj, result);
  return result;
}
export function toReactive(value: any) {
  return isObject(value) ? reactive(value) : value;
}
