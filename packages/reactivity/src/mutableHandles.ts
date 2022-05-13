import { activeEffect } from "./effect";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}
const effectFnMaps = new Map();
export const mutableHandles: ProxyHandler<any> = {
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
    effectFnMaps.set(key, activeEffect.fn);
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver);
  },
};
