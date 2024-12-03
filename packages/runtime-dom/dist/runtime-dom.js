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
function isReactive(obj) {
  return obj["__v_isReactive" /* IS_REACTIVE */];
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
    ref2._dep || (ref2._dep = createDep(() => ref2._dep = void 0, `undefined`))
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
function isRef(obj) {
  return obj.__v__isRef;
}

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
      trackRefValue(this);
    }
    return this._value;
  }
  set value(v) {
    this.setter(v);
  }
};

// packages/reactivity/src/apiWatch.ts
function watch(source, callback, options) {
  doWatch(source, callback, options);
}
function doWatch(source, callback, { deep = false, depth = 0, immediate = false }) {
  let getter;
  if (isReactive(source)) {
    getter = () => traves(source, depth = deep ? depth ? depth : Infinity : 1, 0);
  } else if (isRef(source)) {
    console.log("ref");
    getter = () => source.value;
  } else if (isFunction(source)) {
    getter = source;
  } else {
    return;
  }
  let oldValue;
  let clean;
  const cleanup = (fn) => {
    clean = () => {
      fn();
      clean = void 0;
    };
  };
  const job = () => {
    const newValue = effect3._run();
    clean && clean();
    callback(newValue, oldValue, cleanup);
    oldValue = newValue;
  };
  const effect3 = new ReactiveEffect(getter, () => {
    job();
  });
  if (immediate) {
    job();
  } else {
    oldValue = effect3._run();
  }
}
function traves(source, depth, currentDepth = 0, seen = /* @__PURE__ */ new Set()) {
  if (!isObject(source)) {
    return source;
  }
  if (depth) {
    if (currentDepth >= depth) {
      return source;
    }
    currentDepth++;
  }
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

// packages/runtime-dom/src/nodeOps.ts
var nodeOps_default = {
  //插入节点
  insert: (el, parent, anchor) => {
    parent.insertBefore(el, anchor || null);
  },
  //移除节点
  remove: (el) => {
    const parent = el.parentNode;
    parent && parent.removeChild(el);
  },
  //创建元素
  createElement: (type) => document.createElement(type),
  //创建文本
  createText: (type) => document.createTextNode(type),
  //设置文本
  setText: (node, text) => node.nodeValue = text,
  //设置元素文本
  setElementText: (node, text) => node.textContent = text,
  //获取父节点
  parentNode: (node) => node.parentNode,
  //获取下一个兄弟节点
  nextSibling: (node) => node.nextSibling
};

// packages/runtime-dom/src/modules/patchAttr.ts
function patchAttr(el, key, value) {
  if (value === null) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value);
  }
}

// packages/runtime-dom/src/modules/patchClass.ts
function patchClass(el, value) {
  if (value === null) {
    el.removeAttribute("class");
  } else {
    el.className = value;
  }
}

// packages/runtime-dom/src/modules/patchEvent.ts
function createInvoker(value) {
  const invoker = (e) => invoker.value(e);
  invoker.value = value;
  return invoker;
}
function patchEvent(el, eventName, value) {
  const invokers = el._vei || (el._vei = {});
  const name = eventName.slice(2).toLowerCase();
  const existing = invokers[name];
  if (existing && value) {
    return existing.value = value;
  }
  if (value) {
    const invoker = createInvoker(value);
    invokers[name] = invoker;
    el.addEventListener(name, invoker);
    return;
  }
  if (existing) {
    el.removeEventListener(name, existing);
    return;
  }
}

// packages/runtime-dom/src/modules/patchStyle.ts
function patchStyle(el, prev, next) {
  const style = el.style;
  if (next) {
    for (let key in next) {
      style[key] = next[key];
    }
  }
  if (prev) {
    for (let key in prev) {
      if (next[key] == null) {
        style[key] = "";
      }
    }
  }
}

// packages/runtime-dom/src/patchProps.ts
function patchProps(el, key, preValue, nextValue) {
  if (key === "class") {
    return patchClass(el, nextValue);
  } else if (key === "style") {
    return patchStyle(el, preValue, nextValue);
  } else if (/^on[A-Z]/.test(key)) {
    return patchEvent(el, key, nextValue);
  } else {
    return patchAttr(el, key, nextValue);
  }
}

// packages/runtime-dom/src/index.ts
var renderOptions = Object.assign({ patchProp: patchProps }, nodeOps_default);
export {
  ReactiveEffect,
  activeEffect,
  computed,
  effect,
  isReactive,
  isRef,
  proxyRefs,
  reactive,
  reactiveEffectMap,
  ref,
  renderOptions,
  toReactive,
  toRef,
  toRefs,
  trackEffect,
  trackRefValue,
  triggerRefValue,
  watch
};
//# sourceMappingURL=runtime-dom.js.map
