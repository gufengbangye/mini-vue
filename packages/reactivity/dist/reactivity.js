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
    this._dirtyLevel = 4 /* Dirty */;
    this.isRunning = 0;
  }
  //会被转化为constructor(){this.fn = fn}
  _run() {
    preClean(this);
    try {
      this.parent = activeEffect;
      activeEffect = this;
      this.isRunning++;
      this.dirty = false;
      return this.fn();
    } finally {
      this.isRunning--;
      afterClean(this);
      activeEffect = this.parent;
    }
  }
  get dirty() {
    return this._dirtyLevel === 4 /* Dirty */;
  }
  set dirty(value) {
    this._dirtyLevel = value ? 4 /* Dirty */ : 0 /* NotDirty */;
  }
};
function preClean(effect3) {
  effect3._trackId++;
  effect3._depsLength = 0;
}
function afterClean(effect3) {
  if (effect3._depsLength < effect3._deps.length) {
    for (let i = effect3._depsLength; i < effect3._deps.length; i++) {
      cleanEffectDep(effect3, effect3._deps[i]);
    }
    effect3._depsLength = effect3._deps.length;
  }
}
function trackEffect(effect3, dep) {
  if (!activeEffect) return;
  if (dep.get(effect3) !== effect3._trackId) {
    dep.set(effect3, effect3._trackId);
    const oldDep = effect3._deps[effect3._depsLength];
    if (oldDep === dep) {
      effect3._depsLength++;
    } else {
      oldDep && cleanEffectDep(effect3, oldDep);
      effect3._deps[effect3._depsLength++] = dep;
    }
  }
}
function cleanEffectDep(effect3, dep) {
  dep.delete(effect3);
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
function isFunction(value) {
  return typeof value === "function";
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
function createDep(cleanup, key) {
  return new Dep(cleanup, key);
}

// packages/reactivity/src/track.ts
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
  triggerEffects(dep);
}
function triggerEffects(dep) {
  for (const effect3 of dep.keys()) {
    if (effect3._dirtyLevel <= 4 /* Dirty */) {
      effect3._dirtyLevel = 4 /* Dirty */;
    }
    if (!effect3.isRunning) {
      effect3.scheduler && effect3.scheduler();
    }
  }
}

// packages/reactivity/src/baseHandler.ts
var baseHandler = {
  get(target, key, receiver) {
    if (key === "__v_isReactive" /* IS_REACTIVE */) {
      return true;
    }
    track(target, key);
    let res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
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
function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}

// packages/reactivity/src/ref.ts
function ref(rawValue) {
  return createRef(rawValue);
}
var RefImpl = class {
  constructor(rawValue) {
    this.rawValue = rawValue;
    this._dep = void 0;
    this.__v__isRef = true;
    this._value = toReactive(rawValue);
  }
  get value() {
    activeEffect && trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (this.rawValue !== newValue) {
      this._value = newValue;
      this.rawValue = newValue;
      triggerRefValue(this);
    }
  }
};
function trackRefValue(ref2) {
  activeEffect && trackEffect(
    activeEffect,
    ref2._dep = createDep(() => ref2._dep = void 0, "undefined")
    //由于ref和reactive的主要不同就是ref:ref(false) reactive:{name:a,b:c} 所以ref不像reactive那样需要使用reactiveEffectMap通过key去拿到不同的dep 他就直接在实例上自身创建一个dep即可
  );
}
function triggerRefValue(ref2) {
  ref2._dep && triggerEffects(ref2._dep);
}
function createRef(rawValue) {
  return new RefImpl(rawValue);
}
function toRef(obj, key) {
  return new ObjectRefImpl(obj, key);
}
function toRefs(obj) {
  let res = {};
  for (const [key, value] of Object.entries(obj)) {
    res[key] = toRef(obj, key);
  }
  return res;
}
function proxyRefs(object) {
  return new Proxy(object, {
    get(target, key, receiver) {
      const r = Reflect.get(target, key, receiver);
      return r.__v__isRef ? r.value : r;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      if (oldValue.__v__isRef) {
        oldValue.value = value;
        return true;
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    }
  });
}
var ObjectRefImpl = class {
  constructor(raw, key) {
    this.raw = raw;
    this.key = key;
    this.__v__isRef = true;
  }
  get value() {
    return this.raw[this.key];
  }
  set value(newValue) {
    this.raw[this.key] = newValue;
  }
};

// packages/reactivity/src/computed.ts
function computed(getterOrOptions) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
var ComputedRefImpl = class {
  constructor(getter, setter) {
    this.setter = setter;
    this._effect = void 0;
    this._dep = void 0;
    this._effect = new ReactiveEffect(
      () => getter(this.value),
      () => {
        triggerRefValue(this);
      }
    );
  }
  get value() {
    console.log(this._effect?.dirty, "dirty");
    if (this._effect?.dirty) {
      this._value = this._effect._run();
      debugger;
      trackRefValue(this);
    }
    return this._value;
  }
  set value(v) {
    console.log("\u8BBE\u7F6E");
    this.setter(v);
  }
};
export {
  ReactiveEffect,
  activeEffect,
  computed,
  effect,
  proxyRefs,
  reactive,
  reactiveEffectMap,
  ref,
  toReactive,
  toRef,
  toRefs,
  trackEffect,
  trackRefValue,
  triggerRefValue
};
//# sourceMappingURL=reactivity.js.map
