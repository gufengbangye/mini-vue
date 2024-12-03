function createInvoker(value: () => void) {
  const invoker: any = (e: any) => invoker.value(e);
  invoker.value = value;
  return invoker;
}
export default function patchEvent(
  el: HTMLElement & { _vei?: Record<PropertyKey, any> },
  eventName: `on${keyof HTMLElementEventMap}`,
  value: () => void
) {
  //在该元素上创建个map
  const invokers = el._vei || (el._vei = {});
  const name = eventName.slice(2).toLowerCase() as keyof HTMLElementEventMap;
  const existing = invokers[name];
  //1.如果之前有该事件现在也有就替换
  if (existing && value) {
    return (existing.value = value);
  }
  if (value) {
    //如果之前没有该事件现在有就添加
    const invoker = createInvoker(value);
    invokers[name] = invoker;
    el.addEventListener(name, invoker);
    return;
  }
  //2.如果之前有该事件现在没有就删除
  if (existing) {
    el.removeEventListener(name, existing);
    return;
  }
}
