import { track, trigger } from "./effect";
import { isObject } from "@mvue/shard";
import { reactive, ReactiveFlags } from "@mvue/reactivity";

const createGetter = (isReadOnly = false) => {
  return function get(target: any, key: string | symbol, receiver: any) {
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
      return !isReadOnly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadOnly;
    } else if (key === ReactiveFlags.RAW) {
      return target;
    }
    if (!isReadOnly) {
      track(target, "get", key);
    }

    //深度代理对象,get获取的值如果不是proxy,但是对象，则代理后返回
    //相比对象直接递归代理，性能提升
    let res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      res = reactive(res);
    }
    return res;
  };
};

const createSetter = () => {
  return function (target: any, key: string | symbol, value: any, receiver: any) {
    let oldval = target[key];
    const result = Reflect.set(target, key, value, receiver);
    if (oldval !== value) {
      trigger(target, "set", key, value, oldval);
    }
    return result;
  };
};

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

export const mutableHandles: ProxyHandler<any> = {
  get,
  set,
};
export const readonlyHandlers: ProxyHandler<any> = {
  get: readonlyGet,
  set(target: any, key: string | symbol, value: any) {
    console.warn(`key:${String(key)} set 失败 因为 target 是 readonly`);
    return true;
  },
};
