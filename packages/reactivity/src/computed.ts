import { activeEffect, ReactiveEffect } from "./effect";
import { isFunction } from "@mini-vue/shared";
import { Dep } from "./Dep";
import { trackRefValue, triggerRefValue } from "./ref";
export function computed(getterOrOptions: { get: any; set: any }) {
  //因为有两种情况 一种是传入get和set 另外一种是传入一个函数 其实这个函数就是get所以我们做一次参数归一化
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
class ComputedRefImpl {
  public _value: any;
  public _effect: activeEffect = undefined;
  public _dep: Dep | void = undefined;
  constructor(
    getter: (value: any) => any,
    public setter: (value: any) => void
  ) {
    this._effect = new ReactiveEffect(
      () => getter(this.value),
      () => {
        triggerRefValue(this); //每执行一次都需要需要将值设置为脏
      }
    );
  }
  get value() {
    console.log(this._effect?.dirty, "dirty");
    if (this._effect?.dirty) {
      //如果是脏的就执行一次
      this._value = this._effect._run(); //每一次结果就是传进来函数的返回值
      trackRefValue(this); //收集依赖
    }
    return this._value;
  }
  set value(v) {
    // return true;
    this.setter(v);
  }
}
// const state = reactive({ name: 1 });
// const name = computed(() => "111" + state.name);
// console.log(name.value);
// effect(() => {
//   console.log(name.value);
// });
//computed实现
//首先computed需要dirty属性进行控制如果值是true即为脏值就重新渲染一次(即执行一遍传进来的函数) 执行完需要将该值变回false
//
