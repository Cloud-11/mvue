import { isObject } from "@mvue/shard/";
import { reactive } from "@mvue/reactivity";
import { ReactEffect, trackEffect, triggerEffect } from "./effect";

const toReactive = (value: any) => {
  return isObject(value) ? reactive(value) : value;
};

class RefImpl {
  public _value: any; //代理过的值存在这
  public __v_isRef = true;
  public dep: Set<ReactEffect> = new Set();
  //rawValue 原始值
  constructor(public _rawValue: any) {
    this._value = toReactive(_rawValue);
  }
  get value() {
    trackEffect(this.dep);
    return this._value;
  }
  set value(newVal: any) {
    if (this._rawValue !== newVal) {
      this._value = toReactive(newVal);
      this._rawValue = newVal;
      triggerEffect(this.dep);
    }
  }
}
export const ref = (value: any) => {
  return new RefImpl(value);
};
