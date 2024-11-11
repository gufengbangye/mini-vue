// packages/reactivity/src/effect.ts
var activeEffect;
var ReactiveEffect = class {
  constructor(fn, schedule) {
    this.fn = fn;
    this.schedule = schedule;
    this._trackId = 0;
    this._deps = [];
    //用于存放当前effect里有多少个dep
    this._depsLength = 0;
  }
  //会被转化为constructor(){this.fn = fn}
  _run() {
    preClean(this);
    try {
      this.parent = activeEffect;
      activeEffect = this;
      return this.fn();
    } finally {
      activeEffect = this.parent;
    }
  }
};
function preClean(effect3) {
  effect3._trackId++;
  effect3._depsLength = 0;
}
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
function trackEffect(effect3, dep) {
  if (dep.get(effect3) !== effect3._trackId) {
    dep.set(effect3, effect3._trackId);
    const oldDep = effect3._deps[effect3._depsLength];
    if (oldDep === dep) {
      effect3._depsLength++;
    } else {
      console.log("dep", oldDep);
      oldDep && cleanEffectDep(effect3, oldDep);
      effect3._deps[effect3._depsLength++] = dep;
    }
  }
}
function trigger(target, key) {
  const depsMap = reactiveEffectMap.get(target);
  for (const effect3 of depsMap.get(key).keys()) {
    effect3.schedule && effect3.schedule();
  }
}
function cleanEffectDep(effect3, dep) {
  dep.delete(effect3);
  if (dep.size === 0) {
    dep.get("cleanup") && dep.get("cleanup")();
  }
}

// packages/reactivity/src/baseHandler.ts
var baseHandler = {
  get(target, key, receiver) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    activeEffect && track(target, key);
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    const oldValue = target[key];
    Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, key);
    }
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
