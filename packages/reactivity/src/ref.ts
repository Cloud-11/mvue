import { isArray, isObject } from "@mvue/shard/";
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

//转ref形式，引用代理好的对象
class ObjectRefImpl {
  constructor(public object: any, public key: string | symbol) {}
  get value() {
    return this.object[this.key];
  }
  set value(newValue) {
    this.object[this.key] = newValue;
  }
}
const toRef = (object: object, key: string | symbol) => {
  return new ObjectRefImpl(object, key);
};

export const toRefs = (object: any) => {
  let newObject = isArray(Object) ? new Array(object.length) : <{ [k: string]: any }>{};
  //重新返回新对象，新对象的每个属性key都赋予新的ref化的值
  //方便对象进行解构后还能拥有响应式，主要是每个新属性都是引用的原来的代理对象。
  for (let key in object) {
    newObject[key] = toRef(object, key);
  }
  return newObject;
};

export function isRef(val: any) {
  return !!val.__v_isRef;
}
export function unRef(val: any) {
  return isRef(val) ? val.value : val;
}
//模板内使用，方便变自动添加.value  渲染使用
export function proxyRef(object: any) {
  return new Proxy(object, {
    get(target, key, receiver) {
      return unRef(Reflect.get(target, key, receiver));
    },
    set(target, key, value, receiver) {
      //旧的是，新的不是这样换
      //旧的是，新的是，直接替换
      //旧的不是，新的是，直接替换
      //旧的不是，新的不是，直接替换
      return isRef(target[key]) && !isRef(value)
        ? (target[key].value = value)
        : Reflect.set(target, key, value, receiver);
    },
  });
}
