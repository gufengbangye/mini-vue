//用于后续将当前的effect和后续响应式数据的改变关联起来
export type activeEffect = void | ReactiveEffect;
export let activeEffect: activeEffect; //联合类型里函数需要被括号括起来
class ReactiveEffect {
  _trackId = 0;
  _deps: Map<any, any>[] = []; //用于存放当前effect里有多少个dep
  _depsLength = 0; //主要用于记录上一次依赖的个数 后续通过比较新老length 删除多余的依赖
  private parent?: activeEffect;
  constructor(private fn: () => void, private schedule: () => void) {} //会被转化为constructor(){this.fn = fn}
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
    preClean(this);
    try {
      //每次进来都要将parent设置为上一个activeEffect
      this.parent = activeEffect;
      activeEffect = this;
      return this.fn();
    } finally {
      activeEffect = this.parent;
    }
  }
}
function preClean(effect: ReactiveEffect) {
  effect._trackId++;
  //每一次执行需要将trackId++ 用于将同一个effect触发多个相同dep时候需要去重
  // effect(() => {
  //   state.name;
  //   state.name;
  //   //由于是同一个effect 所以不需要触发 不需要存在dep 可以通风trackId区分
  // })
  // effect(() => {
  //   state.name;
  //   effect(() => {
  //     state.name;   //这样就要将这个effect推入到当前的dep因为effect并不相同
  //   })
  // })
  effect._depsLength = 0; //将该值重置为0 后续将用于新老dep清空
}
export function effect(fn: () => void) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect._run();
  });
  return _effect._run();
}
