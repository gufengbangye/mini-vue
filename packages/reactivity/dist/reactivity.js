// packages/reactivity/src/effect.ts
var activeEffect;
var reactiveEffectMap = /* @__PURE__ */ new WeakMap();
var ReactiveEffect = class {
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this._trackId = 0;
    this._deps = [];
    //用于存放当前effect里有多少个dep
    this._depsLength = 0;
    this.isRunning = 0;
  }
  //会被转化为constructor(){this.fn = fn}
  _run() {
    preClean(this);
    try {
      this.parent = activeEffect;
      activeEffect = this;
      this.isRunning++;
      return this.fn();
    } finally {
      this.isRunning--;
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
    dep.set(effect2, effect2._trackId);
    const oldDep = effect2._deps[effect2._depsLength];
    if (oldDep === dep) {
      effect2._depsLength++;
    } else {
      oldDep && cleanEffectDep(effect2, oldDep);
      effect2._deps[effect2._depsLength++] = dep;
    }
  }
}
function cleanEffectDep(effect2, dep) {
  dep.delete(effect2);
  if (dep.size === 0) {
    dep.cleanup();
  }
}
function effect(fn, options) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect._run();
  });
  if (options) {
    Object.assign(_effect, options);
  }
  _effect._run();
  const runner = _effect._run.bind(_effect);
  runner._effect = _effect;
  return runner;
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
    if (!effect2.isRunning) {
      effect2.scheduler && effect2.scheduler();
    }
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
