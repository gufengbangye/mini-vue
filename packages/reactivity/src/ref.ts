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
function trackRefValue(ref: RefImpl) {
  activeEffect &&
    trackEffect(
      activeEffect,
      (ref._dep = createDep(() => (ref._dep = undefined), "undefined"))
      //由于ref和reactive的主要不同就是ref:ref(false) reactive:{name:a,b:c} 所以ref不像reactive那样需要使用reactiveEffectMap通过key去拿到不同的dep 他就直接在实例上自身创建一个dep即可
    );
}
//触发ref依赖
function triggerRefValue(ref: RefImpl) {
  ref._dep && triggerEffects(ref._dep);
}
function createRef(rawValue: any): RefImpl {
  return new RefImpl(rawValue);
}
