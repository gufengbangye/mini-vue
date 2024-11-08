import { activeEffect } from "./effect";
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
//将effect和dep做关联
function trackEffect(effect: Exclude<activeEffect, void>, dep: Map<any, any>) {
  dep.set(effect, effect._trackId);
  //todo
  //将每个effect存到dep里 一个dep在同一个effect中只需要一次监听不需要多次
  effect._deps[effect._depsLength++] = dep;
}
