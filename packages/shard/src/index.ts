import { ReactiveFlags } from "@mvue/reactivity";

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
export const isReadOnly = (val: any) => !!(val && val[ReactiveFlags.IS_READONLY]);
export const isProxy = (val: any) => isReactive(val) || isReadOnly(val);
