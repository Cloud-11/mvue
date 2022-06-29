import { track, trigger } from "./effect";
import { isObject, ReactiveFlags, isSymbol, isShallow, isRef, isArray } from "@mvue/shard";
import { reactive } from "@mvue/reactivity";
import { readonly, toRaw } from "./reactive";

function makeMap(str: string) {
  const res = new Map<string, boolean>();
  const list = str.split(",");
  for (let i = 0; i < list.length; i++) {
    res.set(list[i], true);
  }
  return (val: string) => !!res.get(val.toLowerCase());
}
//不需要收集的属性
const isNonTrackableKeys = makeMap(`__proto__,__v_isRef,__isVue`);

//获取symbol属性
const a = Object.getOwnPropertyNames(Symbol);

const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map((key) => (Symbol as any)[key])
    .filter(isSymbol)
);

const createGetter = (isReadOnly = false, shallow = false) => {
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
    } else if (key === ReactiveFlags.IS_SHALLOW) {
      return shallow;
    } else if (key === ReactiveFlags.RAW) {
      return target;
    }
    if (!isReadOnly) {
      track(target, "get", key);
    }
    //处理数组 方法 数组的一些方法无法被代理检测

    //深度代理对象,get获取的值如果不是proxy,但是对象，则代理后返回
    //相比对象直接递归代理，性能提升
    let res = Reflect.get(target, key, receiver);

    //检查需要获取的key是否是symbol  __proto__ 等不需要收集的属性
    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res;
    }
    //如果是浅层代理，则直接返回
    if (shallow) {
      return res;
    }
    // if (isRef(res)) {
    // }
    //深层代理
    if (isObject(res)) {
      res = isReadOnly ? readonly(res) : reactive(res);
    }
    return res;
  };
};

const createSetter = (shallow = false) => {
  return function (target: any, key: string | symbol, value: any, receiver: any) {
    let oldValue = target[key];
    if (!isShallow(value)) {
      value = toRaw(value);
      oldValue = toRaw(oldValue);
    }
    if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
      oldValue.value = value;
      return true;
    }
    const result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, "set", key, value, oldValue);
    }
    return result;
  };
};

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

const shallowGet = createGetter(false, true);
const shallowSet = createSetter(true);
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
export const shallowHandlers: ProxyHandler<any> = {
  get: shallowGet,
  set: shallowSet,
};
