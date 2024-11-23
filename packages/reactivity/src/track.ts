import { activeEffect, trackEffect, reactiveEffectMap, effect } from "./effect";
import { Dep, createDep } from "./Dep";
import { DirtyLevels } from "./constants";
export function track(target: object, key: PropertyKey) {
  //只在effect函数里收集依赖即activeEffect不为空
  if (!activeEffect) return;
  let depsMap = reactiveEffectMap.get(target);
  if (!depsMap) {
    reactiveEffectMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = createDep(() => depsMap.delete(key), key)));
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

export function trigger(target: object, key: PropertyKey) {
  const depsMap = reactiveEffectMap.get(target); //从reactiveEffectMap里获取对应的dep
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (!dep) return;
  triggerEffects(dep);
}
export function triggerEffects(dep: Dep) {
  for (const effect of dep.keys()) {
    if (effect._dirtyLevel <= DirtyLevels.Dirty) {
      //每次执行需要将之前的dirty变成脏的
      effect._dirtyLevel = DirtyLevels.Dirty;
    }
    if (!effect.isRunning) {
      effect.scheduler && effect.scheduler();
    }
  }
}
