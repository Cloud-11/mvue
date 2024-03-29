import { VNode } from "./../../runtime-core/src/vnode";
import type { Target } from "@mvue/reactivity";
import { ReactiveFlags } from "./reactiveFlags";
export * from "./reactiveFlags";
export * from "./shapeFlags";
export * from "./pathFlags";

//type
export type iteratorAny<K extends string | number | symbol = string | number | symbol, T = any> = {
  [key in K]: T;
};
export const isArray = Array.isArray;

export const isRef = (val: unknown): boolean => !!(val as Target)?.[ReactiveFlags.IS_REF];
export function isReactive(val: unknown): boolean {
  if (isReadonly(val)) {
    return isReactive((val as Target)[ReactiveFlags.RAW]);
  }
  return !!(val as Target)?.[ReactiveFlags.IS_REACTIVE];
}
export const isReadonly = (val: unknown) => !!(val as Target)?.[ReactiveFlags.IS_READONLY];
export const isShallow = (val: unknown) => !!(val as Target)?.[ReactiveFlags.IS_SHALLOW];
export const isProxy = (val: unknown) => isReactive(val) || isReadonly(val);

export const objectToString = Object.prototype.toString;
export const toTypeString = (value: unknown): string => objectToString.call(value);
export const isMap = (val: unknown): val is Map<any, any> => toTypeString(val) === "[object Map]";
export const isSet = (val: unknown): val is Set<any> => toTypeString(val) === "[object Set]";

export const isDate = (val: unknown): val is Date => val instanceof Date;
export const isFunction = (val: unknown): val is Function => typeof val === "function";
export const isString = (val: unknown): val is string => typeof val === "string";
export const isNumber = (val: unknown): val is number => typeof val === "number";
export const isSymbol = (val: unknown): val is symbol => typeof val === "symbol";
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === "object";

export const isPromise = <T = any>(val: unknown): val is Promise<T> => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch);
};

export const isVNode = (val: unknown): val is VNode => !!(val as any)?.["__v_isVNode"];

export const isSameVnode = (n1: VNode, n2: VNode): boolean => {
  return n1.type === n2.type && n1.key === n2.key;
};
export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (val: object, key: string | symbol): key is keyof typeof val =>
  hasOwnProperty.call(val, key);

export const loopRunArrayFns = (fns: Function[]) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i]();
  }
};
