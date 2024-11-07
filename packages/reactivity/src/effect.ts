//用于后续将当前的effect和后续响应式数据的改变关联起来
export let activeEffect: void | (() => void); //联合类型里函数需要被括号括起来
class ReactiveEffect {
  constructor(private fn: () => void) {} //会被转化为constructor(){this.fn = fn}
  _run() {
    //当前代码有个问题就是当嵌套的effect会出现问题
    //代码例子
    // import { reactive, effect } from "./reactivity.js";
    // const target = {
    //   name: 1,
    //   pink: 2,
    //   address: 3,
    // };
    // const state = reactive(target);
    // effect(() => {
    //   console.log(state.name); //当前activeEffect对应的是当前的effect
    //     effect(() => {
    //   console.log(state.address);//当前activeEffect对应的是当前的effect但是执行完这句activeEffect会变成undefined
    // })
    //   console.log(state.pink); //这个时候这个里对应的activeEffect为undefined
    // });

    activeEffect = this.fn;
    this.fn();
    activeEffect = void 0;
  }
}
export function effect(fn: () => void) {
  const _effect = new ReactiveEffect(fn);
  _effect._run();
}
