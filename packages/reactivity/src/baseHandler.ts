import { track, trigger } from "./track";
import { isObject } from "@mini-vue/shared";
import { reactive } from "./reactive";
export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}
export const baseHandler = {
  get(target: object, key: PropertyKey, receiver: any): any {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    track(target, key);
    let res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(
    target: Record<PropertyKey, any>,
    key: PropertyKey,
    value: any,
    receiver: any
  ): boolean {
    const oldValue = target[key];
    Reflect.set(target, key, value, receiver); //需要先执行一次不然effect执行时候还是上一次的值
    if (oldValue !== value) {
      trigger(target, key);
    }
    return Reflect.set(target, key, value, receiver);
  },
};
