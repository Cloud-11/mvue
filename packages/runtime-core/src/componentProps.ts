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
