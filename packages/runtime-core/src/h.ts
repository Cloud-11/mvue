import { isArray, isObject, isVNode, isString, isNumber } from "@mvue/shard/";
import { createTextVnode, createVnode, VNode } from "./vnode";

/*
// type only
h('div')

// type + props
h('div', {})



// type + props + children
h('div', {}, []) // array
h('div', {}, 'foo') // text
h('div', {}, h('br')) // vnode
h(Component, {}, () => {}) // default slot
h(Component, {}, {}) // named slots

// named slots without props requires explicit `null` to avoid ambiguity
h(Component, null, {})
**/
export function h(type: any, propsOrChildren?: any, children?: any) {
  const l = arguments.length;
  if (l === 2) {
    // type + omit props + children
    // Omit props does NOT support named slots
    // h('div', []) // array
    // h('div', 'foo') // text
    // h('div', h('br')) // vnode
    // h(Component, () => {}) // default slot
    //第2个参数可能 1. props 2. children
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        //是children
        return createVnode(type, null, [propsOrChildren as VNode]);
      }
      //是props
      return createVnode(type, propsOrChildren);
    } else {
      //是数组或者不是对象 2种情况 不是对象就是字符 文本
      return createVnode(type, null, propsOrChildren);
    }
  } else {
    if (l === 3) {
      if (isVNode(children)) {
        //单个vnode包一层数组
        children = [children];
      } else if (isArray(children)) {
        //children是数组，内容不是vnode,进行转换
        for (let i = 0; i < children.length; i++) {
          if (isString(children[i]) || isNumber(children[i])) {
            children[i] = createTextVnode(String(children[i]));
          }
        }
      }
      //其他children原样
    } else if (l > 3) {
      //多个children合并成数组
      children = Array.from(arguments).slice(2);
    }
    return createVnode(type, propsOrChildren, children);
  }
}
