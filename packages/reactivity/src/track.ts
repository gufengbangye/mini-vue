import { activeEffect, effect } from "./effect";
type Exclude<T, U> = T extends U ? never : T;
const reactiveEffectMap = new WeakMap();
function createDep(cleanup: () => void, key: PropertyKey) {
  const dep = new Map();
  dep.set("cleanup", cleanup);
  dep.set("name", key);
  return dep;
}
export function track(target: object, key: PropertyKey) {
  //只在effect函数里收集依赖即activeEffect不为空
  if (!activeEffect) return;
  let depsMap = reactiveEffectMap.get(target);
  if (!depsMap) {
    reactiveEffectMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = createDep(() => dep.delete(key), key)));
  }
  trackEffect(activeEffect, dep);
  // const target =
  // //需要构建一个map由于收集依赖
  // {
  //     {name:1,iphone:2}:{
  //         name:{
  //             effect
  //         },
  //         key2:{
  //             effect
  //         }
  //     }
  // }
  //需要将effect和dep做关联 这样当相关的dep改变 就可以去找到effect执行
  // name改变就要去触发effect
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
function trackEffect(effect: Exclude<activeEffect, void>, dep: Map<any, any>) {
  if (dep.get(effect) !== effect._trackId) {
    //如果这个dep里的effect的_trackId和当前effect的_trackId不相等说明这个effect没有监听过这个dep
    dep.set(effect, effect._trackId);
    const oldDep = effect._deps[effect._depsLength];
    if (oldDep === dep) {
      effect._depsLength++;
    } else {
      console.log("dep", oldDep);
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
  //todo
  //将每个effect存到dep里 一个dep在同一个effect中只需要一次监听不需要多次
  // effect._trackId
  // effect._deps[effect._depsLength++] = dep;
  // console.log(reactiveEffectMap, "map");
}
export function trigger(target: object, key: PropertyKey) {
  const depsMap = reactiveEffectMap.get(target); //从reactiveEffectMap里获取对应的dep
  for (const effect of depsMap.get(key).keys()) {
    effect.schedule && effect.schedule();
  }
}
function cleanEffectDep(effect: activeEffect, dep: Map<any, any>) {
  //要从oldDEP移除effect
  dep.delete(effect);
  if (dep.size === 0) {
    //存放每一个effect 如果依赖里没有长度了就将所有的移除
    dep.get("cleanup") && dep.get("cleanup")();
  }
}
