import { VNode } from "./../../runtime-core/src/vnode";
import type { Target } from "@mvue/reactivity";
import { ReactiveFlags } from "./reactiveFlags";
export * from "./reactiveFlags";
export * from "./shapeFlags";

/**
 * isObject
 * @param obj
 * @returns
 */
export const isArray = Array.isArray;

export const isRef = (val: unknown): boolean => !!(val as Target)?.[ReactiveFlags.IS_REF];
export function isReactive(val: unknown): boolean {
  if (isReadonly(val)) {
    return isReactive((val as Target)[ReactiveFlags.RAW]);
  }
  return !!(val as Target)?.[ReactiveFlags.IS_REACTIVE];
}
export const isReadonly = (val: unknown) => !!(val as Target)?.[ReactiveFlags.IS_READONLY];
export const isProxy = (val: unknown) => isReactive(val) || isReadonly(val);

export const objectToString = Object.prototype.toString;
export const toTypeString = (value: unknown): string => objectToString.call(value);
export const isMap = (val: unknown): val is Map<any, any> => toTypeString(val) === "[object Map]";
export const isSet = (val: unknown): val is Set<any> => toTypeString(val) === "[object Set]";

export const isDate = (val: unknown): val is Date => val instanceof Date;
export const isFunction = (val: unknown): val is Function => typeof val === "function";
export const isString = (val: unknown): val is string => typeof val === "string";
export const isSymbol = (val: unknown): val is symbol => typeof val === "symbol";
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === "object";

export const isPromise = <T = any>(val: unknown): val is Promise<T> => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch);
};

export const isVNode = (val: unknown): boolean => !!(val as any)?.["__v_VNode"];

export const isSameVnode = (n1: VNode, n2: VNode): boolean => {
  return n1.type === n2.type && n1.key === n2.key;
};
