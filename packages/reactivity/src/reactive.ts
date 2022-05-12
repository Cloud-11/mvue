import isObject from "@mvue/shard";
const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}
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

  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }
  if (reactiveMap.get(target)) {
    return reactiveMap.get(target);
  }

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      /*为了正确的收集属性使用Reflect
      * let target = {
          name:"123",
          get name2(){
              return this.name
          }
       }
       取name2时无法正确收集name属性，
       Reflect（反射）会将name2中的this改变为receiver(代理对象==proxy)
      */
      if (key === ReactiveFlags.IS_REACTIVE) {
        return true;
      }
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      return Reflect.set(target, key, value, receiver);
    },
  });
  reactiveMap.set(target, proxy);
  return proxy;
}
