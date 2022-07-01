import { shallowReactive } from "@mvue/reactivity";
import { hasOwn } from "@mvue/shard";
import { ComponentInstance } from "./vnode";

export function initProps(instance: ComponentInstance, vnodeProps: any) {
  let props: any = {};
  let attrs: any = {};
  //vnode的props 包含组件的props和传递attrs 包含具体的值和key
  if (vnodeProps) {
    for (const key in vnodeProps) {
      //如果组件的props中有这个key
      if (hasOwn(instance.propsOptions, key)) {
        props[key] = vnodeProps[key];
      } else {
        attrs[key] = vnodeProps[key];
      }
    }
  }
  instance.props = shallowReactive(props);
  instance.attrs = attrs;
}
//props是否需要更新
export const shouldUpdateProps = (oldProps: any, newProps: any) => {
  let newKeys = Object.keys(newProps);
  if (Object.keys(oldProps).length !== newKeys.length) {
    return true;
  }
  for (let i = 0; i < newKeys.length; i++) {
    const key = newKeys[i];
    if (oldProps[key] !== newProps[key]) {
      return true;
    }
  }

  return false;
};
//比对props
export const patchComponentProps = (oldProps: any, newProps: any) => {
  for (let key in newProps) {
    if (oldProps[key] !== newProps[key]) {
      //更新props
      oldProps[key] = newProps[key];
    }
  }
  for (let key in oldProps) {
    if (!(key in newProps)) {
      //删除props
      delete oldProps[key];
    }
  }
};
