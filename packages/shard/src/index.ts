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
