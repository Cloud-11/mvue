import { track, trigger } from "./effect";
import { isObject } from "@mvue/shard";
import { reactive } from "@mvue/reactivity";

//!!!判断是否已经代理过
//代理过的对象 会执行判断该参数的代码
export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

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
    track(target, "get", key);
    //深度代理对象,get获取的值如果不是proxy,但是对象，则代理后返回
    //相比对象直接递归代理，性能提升
    let res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      res = reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    let oldval = target[key];
    const result = Reflect.set(target, key, value, receiver);
    if (oldval !== value) {
      trigger(target, "set", key, value, oldval);
    }
    return result;
  },
};
