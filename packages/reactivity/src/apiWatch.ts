//watch使用
//当一个值改变后会执行传入的函数

import { isFunction, isObject } from "@mini-vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";
import { isRef } from "./ref";

//watch本质也是个effect 为了将当前的source和callback关联起来我们需要将source的每个属性遍历一下 这样就可以通过reactiveEffect关联起来
type watchOptions = {
  deep?: boolean;
  depth?: number;
  immediate?: boolean;
};
export function watch(
  source: any,
  callback: () => void,
  options: watchOptions
) {
  doWatch(source, callback, options);
}
function doWatch(
  source: any,
  callback: (oldValue: any, newValue: any) => void,
  { deep = false, depth = 0, immediate = false }: watchOptions
) {
  let getter;
  debugger;
  if (isReactive(source)) {
    getter = () =>
      traves(source, (depth = deep ? (depth ? depth : Infinity) : 1), 0);
  } else if (isRef(source)) {
    //就访问.value
    console.log("ref");
    getter = () => source.value;
  } else if (isFunction(source)) {
    //如果函数的话函数就是那个getter
    getter = source;
  } else {
    return;
  }
  let oldValue: any;
  //如果是当响应式才可以进行监听

  const job = () => {
    const newValue = effect._run();
    callback(newValue, oldValue);
    oldValue = newValue;
  };

  const effect = new ReactiveEffect(getter, () => {
    job();
  });
  oldValue = effect._run();
  if (immediate) {
    job();
  }
}
//遍历对象每个属性 这样就会触发get从而将属性和当前的effect关联起来
function traves(
  source: any,
  depth: number,
  currentDepth: number = 0,
  seen: Set<object> = new Set()
) {
  if (!isObject(source)) {
    return source;
  }
  if (depth) {
    //如果需要遍历那就递归
    if (currentDepth >= depth) {
      //如果currentDepth值大于depth就直接返回不在遍历子集
      return source;
    }
    currentDepth++;
  }
  //为了防止循环引用每次将属性添加到seen里如果有的话直接返回source即可
  if (seen.has(source)) {
    return source;
  } else {
    seen.add(source);
  }
  for (const key in source) {
    traves(source[key], depth, currentDepth, seen);
  }
  return source;
}
