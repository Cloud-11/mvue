import { isArray } from "@mvue/shard/";
type EventValue = Function | Function[];
interface Invoker extends EventListener {
  value: EventValue;
}
export const patchEvent = (
  el: Element & { _vei?: Record<string, Invoker | undefined> },
  key: string,
  nextValue: EventValue
) => {
  //事件保存起来，方便后面移除
  let invokers = el._vei || (el._vei = {});
  let eventName = key.slice(2).toLowerCase();
  const existInvoker = invokers[eventName];
  if (existInvoker && nextValue) {
    //已经存在的event 直接替换
    //不用remove 优化性能。
    existInvoker.value = nextValue;
  } else {
    if (nextValue) {
      //新增event
      const invoker = (invokers[eventName] = createInvoker(nextValue));
      el.addEventListener(eventName, invoker);
    } else if (existInvoker) {
      //存在且值为空，删除
      el.removeEventListener(eventName, existInvoker);
      delete invokers[eventName];
    }
  }
};
function createInvoker(fn: EventValue): Invoker {
  const invoker: Invoker = (e: Event) => {
    //是数组fn
    if (isArray(invoker.value)) {
      for (let i = 0; i < invoker.value.length; i++) {
        invoker.value[i]();
      }
    } else {
      invoker.value(e);
    }
  };
  //事件名字没变，只是修改回调函数的情况，修改value就行，优化性能
  invoker.value = fn;
  return invoker;
}
