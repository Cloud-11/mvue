import { track, trigger } from "./effect";

//!!!判断是否已经代理过
//代理过的对象 会执行判断该参数的代码
export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

export const mutableHandles: ProxyHandler<any> = {
  get(target, key, receiver) {
    /*为了正确的收集属性使用Reflect
      * let target = {
          name:"123",
          get name2(){
              return this.name
          }
       }
       取name2时无法正确收集name属性，
       Reflect（反射）会将name2中的this改变为receiver(代理对象==proxy)
      */
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    track(target, "get", key);
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    let oldval = target[key];
    const result = Reflect.set(target, key, value, receiver);
    if (oldval !== value) {
      trigger(target, "set", key, value, oldval);
    }
    return result;
  },
};
