import { isFunction } from "@mvue/shard/";
import { ReactiveEffect, trackEffect, triggerEffect } from "./effect";

class ComputedRefImpl {
  public effect;
  //脏值标志。是否运行getter
  public _dirty = true;
  public __v_isReadOnly = true;
  public __v_isRef = true;
  //返回的组合值
  public _value: any;
  public dep: Set<ReactiveEffect> = new Set();
  constructor(getter: () => any, public setter: (params?: any) => void) {
    //effect.run()时 activeEffect=this.effect
    //所以这里不会收集到effect依赖
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        //此处搭建属性-->依赖属性的计算属性的effect(this.effect)-->依赖计算属性的effect的关联
        //属性更新-->执行进入这里-->触发运行 依赖计算属性的effect
        //   -->effect内部会去get计算属性-->走get进去执行this.effect.run 就是再执行次this.getter重新计算计算属性
        triggerEffect(this.dep);
      }
    });
  }
  //类的属性访问器  访问该类实例的value属性会拦截   Object.defineProperty
  get value() {
    //收集依赖收集的是get计算属性的依赖,而触发更新是计算属性依赖的里面的reactive的属性()
    trackEffect(this.dep);
    if (this._dirty) {
      //先修改，否则导致触发依赖时循环,会不停的触发get
      this._dirty = false;
      //computed内的函数会运行，然后返回计算属性
      //computed的方法
      //effect收集的只是内部的属性变化，没有关联最后的计算属性(_value)
      //所以，即使computed里的函数依赖的属性变化了，最后返回的计算属性也不会触发更新，因为根本没关联
      //第一次此处会进行effect的收集, 建立 计算属性依赖的属性和getter的依赖，即 此处等于正常的effect和属性
      this._value = this.effect.run();
    }
    return this._value;
  }
  set value(newValue) {
    this.setter(newValue);
  }
}

type getterAndSetter = { get: () => any; set: () => void };
type getterOrOption = getterAndSetter | (() => any);

export const computed = (getterOrOptions: getterOrOption) => {
  let getter, setter;
  if (isFunction(getterOrOptions)) {
    getter = <() => any>getterOrOptions;
    setter = () => {
      console.warn("Write operation failed: computed value is readonly");
    };
  } else {
    getter = (<getterAndSetter>getterOrOptions).get;
    setter = (<getterAndSetter>getterOrOptions).set;
  }

  return new ComputedRefImpl(getter, setter);
};
