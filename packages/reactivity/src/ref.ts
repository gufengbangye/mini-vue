import { toReactive } from "./reactive";
import { activeEffect, trackEffect } from "./effect";
import { Dep, createDep } from "./Dep";
import { triggerEffects } from "./track";
export function ref(rawValue: any): RefImpl {
  return createRef(rawValue);
}
class RefImpl {
  public _value: any;
  public _dep: Dep | void = undefined;
  public __v__isRef = true;
  constructor(public rawValue: any) {
    //rawValue主要是为了解决 修改时值是否更新
    this._value = toReactive(rawValue); //这个_value是要被代理的
  }
  get value() {
    activeEffect && trackRefValue(this);
    return this._value;
  }
  set value(newValue: any) {
    if (this.rawValue !== newValue) {
      this._value = newValue;
      this.rawValue = newValue;
      triggerRefValue(this);
    }
  }
}
//收集ref依赖
export function trackRefValue(ref: { _dep: Dep | void }) {
  activeEffect &&
    trackEffect(
      activeEffect,
      ref._dep ||
        (ref._dep = createDep(() => (ref._dep = undefined), `undefined`))
      //由于ref和reactive的主要不同就是ref:ref(false) reactive:{name:a,b:c} 所以ref不像reactive那样需要使用reactiveEffectMap通过key去拿到不同的dep 他就直接在实例上自身创建一个dep即可
    );
  // activeEffect &&
  //   trackEffect(
  //     activeEffect,
  //     (ref._dep = createDep(
  //       () => (ref._dep = undefined),
  //       `undefined${index++}`
  //     ))
  //     //由于ref和reactive的主要不同就是ref:ref(false) reactive:{name:a,b:c} 所以ref不像reactive那样需要使用reactiveEffectMap通过key去拿到不同的dep 他就直接在实例上自身创建一个dep即可
  //   );
  //这样写会导致每次都会创建新的一个dep
  //1.当我们在trackEffect时候由于会比较新老dep如果不一致就会做一次删除
  //2.由于ref的特殊dep只会有一项所以当执行cleanEffectDep时候删除了一项 看到dep为空就会将ref._dep属性置为undefined(ref是同一个引用)
  //3.后续触发triggerRefValue时由于ref._dep为undefined所以后续一直不执行导致了watch只触发一次
}
//触发ref依赖
export function triggerRefValue(ref: { _dep: Dep | void }) {
  ref._dep && triggerEffects(ref._dep);
}
function createRef(rawValue: any): RefImpl {
  return new RefImpl(rawValue);
}
//toRef
export function toRef(obj: object, key: PropertyKey) {
  return new ObjectRefImpl(obj, key);
}
export function toRefs(obj: object) {
  let res: Record<PropertyKey, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    res[key] = toRef(obj, key);
  }
  return res;
}
export function proxyRefs(object: Record<PropertyKey, any>) {
  return new Proxy(object, {
    get(target, key, receiver) {
      //如果是ref就去读取ref.value不是的话就正常
      const r = Reflect.get(target, key, receiver);
      return r.__v__isRef ? r.value : r;
    },
    set(target, key, value, receiver) {
      const oldValue: any = target[key];
      if (oldValue.__v__isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    },
  });
}
class ObjectRefImpl {
  public __v__isRef = true;
  constructor(public raw: Record<PropertyKey, any>, public key: PropertyKey) {}
  get value() {
    return this.raw[this.key];
  }
  set value(newValue: any) {
    this.raw[this.key] = newValue;
  }
}
export function isRef(obj: any): boolean {
  return obj.__v__isRef;
}
