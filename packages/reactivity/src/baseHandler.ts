import { track, trigger } from "./track";
import { activeEffect } from "./effect";
export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}
export const baseHandler = {
  get(target: object, key: PropertyKey, receiver: any): any {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    activeEffect && track(target, key);
    return Reflect.get(target, key, receiver);
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
