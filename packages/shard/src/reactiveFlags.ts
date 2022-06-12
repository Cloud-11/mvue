//代理过的对象 会执行判断该参数的代码
export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadOnly",
  RAW = "__v_raw",
  SKIP = "__v_skip",
  IS_REF = "__v_isRef",
}
