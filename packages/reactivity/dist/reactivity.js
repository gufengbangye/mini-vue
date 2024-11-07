// packages/reactivity/src/effect.ts
var activeEffect;
var ReactiveEffect = class {
  constructor(fn) {
    this.fn = fn;
  }
  //会被转化为constructor(){this.fn = fn}
  _run() {
    try {
      this.parent = activeEffect;
      activeEffect = this.fn;
      this.fn();
    } finally {
      activeEffect = this.parent;
    }
  }
};
function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect._run();
}

// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value != null;
}

// packages/reactivity/src/baseHandler.ts
var baseHandler = {
  get(target, key, receiver) {
    console.log("\u89E6\u53D1\u4EE3\u7406");
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
  activeEffect,
  effect,
  reactive
};
//# sourceMappingURL=reactivity.js.map
