// packages/reactivity/src/effect.ts
var activeEffect;
var ReactiveEffect = class {
  constructor(fn, schedule) {
    this.fn = fn;
    this.schedule = schedule;
    this._trackId = 0;
    this._deps = [];
    this._depsLength = 0;
  }
  //会被转化为constructor(){this.fn = fn}
  _run() {
    try {
      this.parent = activeEffect;
      activeEffect = this;
      return this.fn();
    } finally {
      activeEffect = this.parent;
    }
  }
};
function effect(fn) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect._run();
  });
  return _effect._run();
}

// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value != null;
}

// packages/reactivity/src/track.ts
var reactiveEffectMap = /* @__PURE__ */ new WeakMap();
function createDep(cleanup, key) {
  const dep = /* @__PURE__ */ new Map();
  dep.set("cleanup", cleanup);
  dep.set("name", key);
  return dep;
}
function track(target, key) {
  if (!activeEffect) return;
  let depsMap = reactiveEffectMap.get(target);
  if (!depsMap) {
    reactiveEffectMap.set(target, depsMap = /* @__PURE__ */ new Map());
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, dep = createDep(() => dep.delete(key), key));
  }
  trackEffect(activeEffect, dep);
}
function trackEffect(effect2, dep) {
  dep.set(effect2, effect2._trackId);
  effect2._deps[effect2._depsLength++] = dep;
}

// packages/reactivity/src/baseHandler.ts
var baseHandler = {
  get(target, key, receiver) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    debugger;
    activeEffect && track(target, key);
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver);
  }
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
  console.log("__v_isReactive" /* IS_REACTIVE */, "lll");
  if (obj["__v_isReactive" /* IS_REACTIVE */]) {
    return obj;
  }
  const result = new Proxy(obj, baseHandler);
  reactiveWeakMap.set(obj, result);
  return result;
}
export {
  activeEffect,
  effect,
  reactive
};
//# sourceMappingURL=reactivity.js.map
