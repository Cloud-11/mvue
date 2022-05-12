import isObject from "@mvue/shard";
export function reactive(target: any) {
  if (!isObject(target)) {
    return;
  }
  return new Proxy(target, {
    get(target, key, receiver) {
      /*为了正确的收集属性使用Reflect
      * let target = {
          name:"123",
          get name2(){
              return this.name
          }
       }
       取name2时无法正确收集name属性，
       Reflect（反射）会将name2中的this改变为receiver(代理对象)
      */
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      return Reflect.set(target, key, value);
    },
  });
}
