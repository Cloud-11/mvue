import { isFunction, isObject, isReactive } from "@mvue/shard";
import { ReactEffect } from "./effect";

//循环对象，考虑对象里循环引用问题，
const traversal = (val: any, set = new Set()) => {
  if (!isObject(val)) return val;
  if (set.has(val)) return val;
  for (let key in val) {
    set.add(val);
    traversal(val[key], set);
  }
  return val;
};
export const watch = (
  source: () => void | object,
  callback: (oldval: any, newVal: any) => void
) => {
  let getter;
  if (isReactive(source)) {
    //   递归循环source上的属性，get值,会触发effect收集
    //每个属性都会收集一遍
    getter = () => traversal(source);
  } else if (isFunction(source)) {
    //函数式取值，触发effect收集
    getter = source;
  } else {
    return;
  }

  let oldVal: any;
  const cb = () => {
    const newVal = effect.run();
    callback(oldVal, newVal);
    oldVal = newVal;
  };
  const effect = new ReactEffect(<() => any>getter, cb);
  //执行getter  触发收集
  oldVal = effect.run();
};
