import { ReactiveFlags } from "packages/reactivity/src/mutableHandles";

/**
 * isObject
 * @param obj
 * @returns
 */
export const isArray = Array.isArray;
export const isFunction = (val: any) => typeof val === "function";
export const isString = (val: any) => typeof val === "string";
export const isSymbol = (val: any) => typeof val === "symbol";
export const isObject = (val: any) => val !== null && typeof val === "object";
export const isReactive = (val: any) => !!(val && val[ReactiveFlags.IS_REACTIVE]);
