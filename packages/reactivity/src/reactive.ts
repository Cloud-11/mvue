import { isObject, isProxy, isReactive, isReadOnly } from "@mvue/shard";
import { mutableHandles, readonlyHandlers } from "./baseHandles";

//!!!判断是否已经代理过
//代理过的对象 会执行判断该参数的代码
export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadOnly",
  RAW = "__v_raw",
}
//防止同一对象代理多次
//WeakMap key只能是对象，弱引用
const reactiveMap = new WeakMap();

const createProxy = (
  target: any,
  handles: ProxyHandler<any>,
  readonly = false,
  proxyMap?: WeakMap<object, any>
) => {
  //非对象无法代理
  if (!isObject(target)) {
    return target;
  }
  //已经代理过，并且readonly=true or reactive=true不能再代理
  if (isProxy(target) && (readonly || isReactive(target))) {
    return target;
  }
  //已经存在代理对象，直接返回
  const existingProxy = proxyMap?.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(target, handles);
  if (proxyMap) {
    proxyMap.set(target, proxy);
  }
  return proxy;
};

export function reactive(target: any) {
  //是否readonly代理对象
  if (isReadOnly(target)) {
    return target;
  }
  const proxy = createProxy(target, mutableHandles, false, reactiveMap);

  return proxy;
}

// 生成readonly 响应式数据
//仅读取不会set,所以不需要
export function readonly(raw: any) {
  return createProxy(raw, readonlyHandlers, true);
}
//获取原始对象
export function toRaw(target: any): any {
  const raw = target[ReactiveFlags.RAW];
  return raw; //? toRaw(raw) : target;
}
