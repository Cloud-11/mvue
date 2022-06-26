import { isFunction, isObject, isReactive } from "@mvue/shard";
import { ReactiveEffect } from "./effect";

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
  callback: (oldval: any, newVal: any, onCleanup: (fn: () => any) => void) => void
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

  //保存旧值
  let oldVal: any;

  //watch的oncleanup解决的是连续请求异步数据，数据返回会一直变。
  //cleanup 可以清除(跳过,不使用)之前的返回的数据，数据变化一步到位。

  //保存清除函数
  let cleanUp: () => any;
  //触发清除函数
  //watch里调用异步函数，http请求等，可以在持续触发状态，清理上次的请求
  const onCleanUp = (fn: () => any) => {
    cleanUp = fn;
  };

  //effect scheduler函数，调度函数。下次触发,优先执行
  //第一次调用，cleanUp才赋值。
  const cb = () => {
    //先执行清除
    if (cleanUp) cleanUp();
    const newVal = effect.run();
    callback(oldVal, newVal, onCleanUp);
    oldVal = newVal;
  };

  const effect = new ReactiveEffect(<() => any>getter, cb);

  //执行getter  触发收集
  oldVal = effect.run();
};
