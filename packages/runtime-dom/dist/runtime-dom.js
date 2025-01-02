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
  setText: (node, text) => {
    node.nodeValue = text;
  },
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

// packages/runtime-dom/src/patchProp.ts
function patchProp(el, key, preValue, nextValue) {
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
function isString(value) {
  return typeof value === "string";
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

// packages/runtime-core/src/createVNode.ts
var Text = Symbol("Text");
var Fragment = Symbol("Fragment");
function isVNode(obj) {
  return obj.__v_isVNode;
}
function isSameVNode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
function createVNode(type, props, children) {
  let shapeFlag = isString(type) ? 1 /* ELEMENT */ : 0;
  if (children) {
    if (Array.isArray(children)) {
      shapeFlag |= 16 /* ARRAY_CHILDREN */;
    } else {
      children = String(children);
      shapeFlag |= 8 /* TEXT_CHILDREN */;
    }
  }
  return {
    __v_isVNode: true,
    //需要标记一下用于后续判断是否为虚拟节点
    type,
    props,
    children,
    shapeFlag,
    key: props?.key,
    el: null
    //需要将元素挂载到虚拟节点上后续方便移除
  };
}

// packages/runtime-core/src/getSeq.ts
function getSequence(arr) {
  const result = [0];
  const p = result.slice(0);
  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];
    if (element !== 0) {
      if (element > arr[result[result.length - 1]]) {
        p.push(result[result.length - 1]);
        result.push(i);
        continue;
      }
    }
    let start = 0;
    let end = result.length - 1;
    let middle = 0;
    while (start < end) {
      middle = (start + end) / 2 | 0;
      if (element > arr[result[middle]]) {
        start = middle + 1;
      } else {
        end = middle;
      }
    }
    if (element < arr[result[start]]) {
      console.log(i);
      p[i] = result[start - 1];
      result[start] = i;
    }
  }
  let l = result.length;
  let last = result[l - 1];
  while (l-- > 0) {
    result[l] = last;
    last = p[last];
  }
  console.log(p);
  console.log(result);
  return result;
}
getSequence([2, 3, 1, 5, 6, 8, 7, 9, 4]);

// packages/runtime-core/src/h.ts
function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren)) {
      if (Array.isArray(propsOrChildren)) {
        return createVNode(type, null, propsOrChildren);
      } else {
        if (isVNode(propsOrChildren)) {
          return createVNode(type, null, propsOrChildren);
        } else {
          return createVNode(type, propsOrChildren);
        }
      }
    }
    return createVNode(type, null, propsOrChildren);
  } else {
    if (l === 3 && isVNode(children)) {
      return createVNode(type, propsOrChildren, [children]);
    }
    if (l > 3) {
      children = Array.from(arguments).slice(2);
      return createVNode(type, propsOrChildren, [children]);
    }
  }
  return createVNode(type, propsOrChildren, children);
}

// packages/runtime-core/src/index.ts
var createRenderer = (options) => {
  const {
    createElement: hostCreateElement,
    createText: hostCreateText,
    insert: hostInsert,
    nextSibling: hostNextSibling,
    parentNode: hostParentNode,
    remove: hostRemove,
    patchProp: hostPatchProp,
    setElementText: hostSetElementText,
    setText: hostSetText
  } = options;
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      console.log(children[i], "child");
      patch(null, children[i], container);
    }
  };
  const mountElement = (n1, container, anchor) => {
    const { type, props, children, shapeFlag } = n1;
    const el = n1.el = hostCreateElement(type);
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      hostSetElementText(el, children);
    } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
      mountChildren(children, el);
    }
    hostInsert(el, container, anchor);
  };
  const unmount = (vNode) => {
    const el = vNode.el;
    el && hostRemove(el);
  };
  const patchProps = (oldProps, newProps, el) => {
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };
  const unmountChildren = (vNode) => {
    for (let i = 0; i < vNode.length; i++) {
      unmount(vNode[i]);
    }
  };
  const patchKeyChildren = (c1, c2, el) => {
    debugger;
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    console.log(i, e1, e2);
    if (i > e1) {
      while (i <= e2) {
        const anchor = c2[i + 1]?.el;
        patch(null, c2[i], el, anchor);
        i++;
      }
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    } else {
      let s1 = i;
      let s2 = i;
      const keyToNewIdexMap = /* @__PURE__ */ new Map();
      const toPatchedLength = e2 - s2 + 1;
      const newIndexToOLdIndexMap = new Array(toPatchedLength).fill(
        0
      );
      for (let i2 = s2; i2 <= e2; i2++) {
        const key = c2[i2].key;
        keyToNewIdexMap.set(key, i2);
      }
      for (let i2 = s1; i2 <= e1; i2++) {
        const key = c1[i2].key;
        if (keyToNewIdexMap.has(key)) {
          const index = keyToNewIdexMap.get(key);
          newIndexToOLdIndexMap[index - s2] = i2;
          patch(c1[i2], c2[index], el);
        } else {
          unmount(c1[i2]);
        }
      }
      const increaseSeq = getSequence(newIndexToOLdIndexMap);
      let j = increaseSeq.length - 1;
      console.log(increaseSeq);
      for (let i2 = toPatchedLength - 1; i2 >= 0; i2--) {
        debugger;
        const newIndex = i2 + s2;
        const vNode = c2[i2 + s2];
        const anchor = c2[newIndex + 1]?.el;
        if (!vNode.el) {
          patch(null, vNode, el, anchor);
        } else {
          if (i2 === increaseSeq[j]) {
            j--;
          } else {
            hostInsert(vNode.el, el, anchor);
          }
        }
      }
    }
  };
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    if (shapeFlag & 8 /* TEXT_CHILDREN */) {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          console.log("\u6570\u7EC4diff");
          patchKeyChildren(c1, c2, el);
        } else {
          unmountChildren(n1);
        }
      } else {
        if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
          hostSetElementText(el, "");
        }
        if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
          mountChildren(c2, el);
        }
      }
    }
  };
  const patchElement = (n1, n2, container) => {
    const el = n2.el = n1.el;
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  };
  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2, container);
    }
  };
  const processText = (n1, n2, container) => {
    if (n1 === null) {
      n2.el = hostCreateText(n2.children);
      hostInsert(n2.el, container, null);
    } else {
      const el = n2.el = n1.el;
      if (n1.children !== n2.children) hostSetText(el, n2.children);
    }
  };
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) return;
    if (n1 && !isSameVNode(n1, n2)) {
      console.log("\u8FDB\u6765\u4E86");
      unmount(n1);
      n1 = null;
    }
    switch (n2.type) {
      case Text:
        processText(n1, n2, container);
        break;
      default:
        processElement(n1, n2, container, anchor);
    }
  };
  const render2 = (vNode, container) => {
    console.log(vNode, container);
    if (vNode === null) {
      container._vNode && unmount(container._vNode);
      return;
    }
    patch(container._vNode || null, vNode, container);
    container._vNode = vNode;
  };
  return {
    render: render2
  };
};

// packages/runtime-dom/src/index.ts
var renderOptions = Object.assign({ patchProp }, nodeOps_default);
var render = createRenderer(renderOptions).render;
export {
  Fragment,
  ReactiveEffect,
  Text,
  activeEffect,
  computed,
  createRenderer,
  createVNode,
  effect,
  h,
  isReactive,
  isRef,
  isSameVNode,
  isVNode,
  proxyRefs,
  reactive,
  reactiveEffectMap,
  ref,
  render,
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
