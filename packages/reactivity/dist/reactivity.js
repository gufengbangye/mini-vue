// packages/reactivity/src/effect.ts
var activeEffect;
var reactiveEffectMap = /* @__PURE__ */ new WeakMap();
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
      afterClean(this);
      activeEffect = this.parent;
    }
  }
};
function preClean(effect2) {
  effect2._trackId++;
  effect2._depsLength = 0;
}
function afterClean(effect2) {
  if (effect2._depsLength < effect2._deps.length) {
    for (let i = effect2._depsLength; i < effect2._deps.length; i++) {
      cleanEffectDep(effect2, effect2._deps[i]);
    }
    effect2._depsLength = effect2._deps.length;
  }
}
function trackEffect(effect2, dep) {
  if (!activeEffect) return;
  if (dep.get(effect2) !== effect2._trackId) {
    debugger;
    dep.set(effect2, effect2._trackId);
    const oldDep = effect2._deps[effect2._depsLength];
    if (oldDep === dep) {
      effect2._depsLength++;
    } else {
      oldDep && cleanEffectDep(effect2, oldDep);
      effect2._deps[effect2._depsLength++] = dep;
    }
  }
  console.log(reactiveEffectMap);
}
function cleanEffectDep(effect2, dep) {
  dep.delete(effect2);
  if (dep.size === 0) {
    dep.cleanup();
  }
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

// packages/reactivity/src/Dep.ts
var Dep = class {
  constructor(cleanup, key) {
    this.map = /* @__PURE__ */ new Map();
    this.cleanup = cleanup;
    this.name = key;
  }
  get size() {
    return this.map.size;
  }
  set(key, value) {
    this.map.set(key, value);
  }
  delete(key) {
    console.log(key, "deletekey");
    this.map.delete(key);
  }
  get(key) {
    return this.map.get(key);
  }
  keys() {
    return this.map.keys();
  }
};

// packages/reactivity/src/track.ts
function createDep(cleanup, key) {
  return new Dep(cleanup, key);
}
function track(target, key) {
  if (!activeEffect) return;
  let depsMap = reactiveEffectMap.get(target);
  if (!depsMap) {
    reactiveEffectMap.set(target, depsMap = /* @__PURE__ */ new Map());
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, dep = createDep(() => depsMap.delete(key), key));
  }
  trackEffect(activeEffect, dep);
}
function trigger(target, key) {
  const depsMap = reactiveEffectMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (!dep) return;
  triggerEffect(dep);
}
function triggerEffect(dep) {
  for (const effect2 of dep.keys()) {
    effect2.schedule && effect2.schedule();
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
  reactive,
  reactiveEffectMap,
  trackEffect
};
//# sourceMappingURL=reactivity.js.map
