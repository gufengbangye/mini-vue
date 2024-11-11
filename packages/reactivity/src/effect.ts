import { Dep } from "./Dep";
//用于后续将当前的effect和后续响应式数据的改变关联起来
export type activeEffect = void | ReactiveEffect;
export let activeEffect: activeEffect; //联合类型里函数需要被括号括起来
export const reactiveEffectMap = new WeakMap();
class ReactiveEffect {
  _trackId = 0;
  _deps: Dep[] = []; //用于存放当前effect里有多少个dep
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
      //移除deps里多余的 由于每一次effect会导致不同的dep都被推入进来如下例子
      // const test = reactive({ a: 1,b:2,c:3,d:4,e:5 });
      // effect(() => {
      //   if(test.a === 1){
      //     console.log(test.b)
      //     console.log(test.c)
      //     console.log(test.d)
      //   }else{
      //     console.log(test.e))
      //   }
      // })
      // setTimeout(() => {
      //   test.a = 0
      // }, 2000);
      //由于第一次effect里有四个dep分别为a,b,c,d 第二次只有a,e所以第二次做完需要将上一次的dep删除 保持双向记忆里都是最新的
      afterClean(this);
      activeEffect = this.parent;
    }
  }
}
//每一次函数执行做的清理工作
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
//函数结束完做的清理工作
function afterClean(effect: ReactiveEffect): void {
  if (effect._depsLength < effect._deps.length) {
    for (let i = effect._depsLength; i < effect._deps.length; i++) {
      cleanEffectDep(effect, effect._deps[i]);
    }
    effect._depsLength = effect._deps.length;
  }
}
// const state = reactive({
//   name:'1',
//   pink:2
// }
// effect(() => {
//   state.name;
//   state.name; //不应该收集
// })
//将effect和dep做关联
export function trackEffect(effect: Exclude<activeEffect, void>, dep: Dep) {
  if (!activeEffect) return;
  if (dep.get(effect) !== effect._trackId) {
    debugger;
    //如果这个dep里的effect的_trackId和当前effect的_trackId不相等说明这个effect没有监听过这个dep
    dep.set(effect, effect._trackId);
    const oldDep = effect._deps[effect._depsLength];
    if (oldDep === dep) {
      effect._depsLength++;
    } else {
      oldDep && cleanEffectDep(effect, oldDep);
      effect._deps[effect._depsLength++] = dep;
    }
    //如果新的和旧的一样那就保留 不一样就删除
    //即下面每一次应该是{name:depMap,pink:depMap} -> {name:depMap,address:depMap}而不是{name:depMap,pink:depMap,address:depMap}
    // effect(() => {
    //   const a = state.name ? state.pink : state.address;
    // });
    // setTimeout(() => {
    //   state.name = 0;
    // }, 2000);
    //通过effect去找dep 我们可以做个简单的对比
    // {flag,name}
    // {flag,address}
    //因为大部分时候代码从上到下执行顺序不变所以可以通过数组顺序即可
  }
  console.log(reactiveEffectMap);
  //todo
  //将每个effect存到dep里 一个dep在同一个effect中只需要一次监听不需要多次
  // effect._trackId
  // effect._deps[effect._depsLength++] = dep;
  // console.log(reactiveEffectMap, "map");
}
//移除dep里的effect
function cleanEffectDep(effect: activeEffect, dep: Dep) {
  //要从oldDEP移除effect
  dep.delete(effect);
  if (dep.size === 0) {
    //存放每一个effect 如果依赖里没有长度了就将所有的移除
    dep.cleanup();
  }
}
export function effect(fn: () => void) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect._run();
  });
  return _effect._run();
}
