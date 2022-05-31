import { isObject } from "@mvue/shard";
import { mutableHandles, ReactiveFlags } from "./mutableHandles";

export function reactive(target: any) {
  if (!isObject(target)) {
    return;
  }
  //防止同一对象代理多次
  //WeakMap key只能是对象，弱引用
  const reactiveMap = new WeakMap();

  //防止代理源对象为代理过的,二次代理
  //源对象可以是用户自己的proxy
  //添加代理标志
  //否是代理对象
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }
  //源对象是否被代理过
  if (reactiveMap.get(target)) {
    return reactiveMap.get(target);
  }

  const proxy = new Proxy(target, mutableHandles);
  reactiveMap.set(target, proxy);
  return proxy;
}

// 生成readonly 响应式数据
export function readonly(raw: any) {
  return new Proxy(raw, {
    get(target, key) {
      return Reflect.get(target, key);
    },

    set(target, key, value) {
      console.warn(`key:${String(key)} set 失败 因为 target 是 readonly`);
      return true;
    },
  });
}
