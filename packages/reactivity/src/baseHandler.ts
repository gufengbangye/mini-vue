import { track } from "./track";
import { activeEffect } from "./effect";
export enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}
export const baseHandler = {
  get(target: object, key: PropertyKey, receiver: any): any {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    debugger;
    activeEffect && track(target, key);
    return Reflect.get(target, key, receiver);
  },
  set(target: object, key: PropertyKey, value: any, receiver: any): boolean {
    return Reflect.set(target, key, value, receiver);
  },
};
