// packages/reactivity/src/effect.ts
function effect() {
  console.log("effect");
}

// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value != null;
}
console.log(1);

// packages/reactivity/src/baseHandler.ts
var baseHandler = {
  get(target, key, receiver) {
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver);
  }
};
var reactiveFlagType = {
  IS_REACTIVE: "__v_isReactive"
};

// packages/reactivity/src/reactive.ts
function reactive(raw) {
  if (!isObject(raw)) {
    return;
  }
  return createReactive(raw);
}
var reactiveWeakMap = /* @__PURE__ */ new WeakMap();
function createReactive(obj) {
  if (reactiveWeakMap.has(obj)) {
    return reactiveWeakMap.get(obj);
  }
  if (obj.IS_REACTIVE) {
    return obj;
  }
  const result = new Proxy(obj, baseHandler);
  result.IS_REACTIVE = reactiveFlagType.IS_REACTIVE;
  reactiveWeakMap.set(obj, result);
  return result;
}
export {
  effect,
  reactive
};
//# sourceMappingURL=reactivity.js.map
