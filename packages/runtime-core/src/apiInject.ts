import { isReactive, isFunction } from "@mvue/shard";
import { currentInstance } from "./component";
export function provide(key: string, value: any) {
  if (!currentInstance) return;

  //   let parentProvides = currentInstance.parent && currentInstance.parent.provides;
  let provides = currentInstance.provides;
  //   //第一次进来 如果和父级的provides一样 则复制一份 防止引用
  //   if (provides === parentProvides) {
  //     provides = currentInstance.provides = Object.create(provides);
  //   }
  provides[key] = value;
}
export function inject(key: string, defaultValue: any) {
  if (!currentInstance) return;
  const provides = currentInstance.parent?.provides;
  if (provides && key in provides) {
    return provides[key];
  }
  if (isFunction(defaultValue)) {
    return defaultValue();
  } else if (isReactive(defaultValue)) {
    return defaultValue;
  } else {
    return defaultValue;
  }
}
