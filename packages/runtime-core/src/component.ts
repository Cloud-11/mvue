import { proxyRef, reactive } from "@mvue/reactivity";
import { iteratorAny, isFunction, isObject } from "@mvue/shard";
import { initProps } from "./componentProps";
import { Component, ComponentInstance, VNode } from "./vnode";
export function createComponentInstance(vnode: VNode) {
  const instance: ComponentInstance = {
    data: null,
    vnode,
    setup: (vnode.type as Component).setup || null,
    subTree: null,
    mounted: false,
    props: {},
    attrs: {},
    //组件内定义的传进来的props只有key
    propsOptions: (vnode.type as Component).props,
    update: () => {},
    proxy: null,
    render: (vnode.type as Component).render,
  };
  return instance;
}
//组件上下文对外暴露属性
const instancePropsMap: iteratorAny = {
  $attrs: (i: ComponentInstance) => i.attrs,
};
export function setupComponent(instance: ComponentInstance) {
  const { props, type } = instance.vnode;
  //初始化props
  initProps(instance, props);
  //设置渲染上下文 proxy
  const proxyHandler: ProxyHandler<ComponentInstance> = {
    get(target, key) {
      const { data, props, setupState } = target;
      if (data?.[key]) {
        return data[key];
      } else if (setupState[key]) {
        return setupState[key];
      } else if (props?.[key]) {
        return props[key];
      }
      const getter = instancePropsMap[key];
      if (getter) {
        return getter(target);
      }
    },
    set(target, key, value) {
      const { data, props, setupState } = target;
      if (data?.[key]) {
        data[key] = value;
        return true;
      } else if (setupState?.[key]) {
        setupState[key] = value;
        return true;
      } else if (props?.[key]) {
        console.warn(`attempting to mutate prop key:${String(key)}`);
        return false;
      }
      return true;
    },
  };
  instance.proxy = new Proxy(instance, proxyHandler);
  //组件data初始化
  let data = (type as Component).data;
  if (data) {
    if (!isFunction(data)) {
      return console.error("data必须是函数");
    }
    instance.data = reactive(data.call(instance.proxy));
  }
  //组件setup初始化
  let setup = (type as Component).setup;
  if (setup) {
    let setupContext = {};
    const setupResult = setup(instance.props as iteratorAny, setupContext);
    if (setupResult) {
      //如果setup返回的是vnode，则直接渲染
      if (isFunction(setupResult)) {
        instance.render = setupResult;
      } else if (isObject(setupResult)) {
        //如果setup返回的是对象，则是组件内部state
        instance.setupState = proxyRef(setupResult);
      }
    }
  }
}
