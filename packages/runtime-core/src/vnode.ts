import { isArray } from "@mvue/shard/";
import { isString, ShapeFlags } from "@mvue/shard";
export interface Component {}
export interface RendererNode {
  [key: string]: any;
}

export interface RendererElement extends RendererNode {}

export interface VNode<
  HostNode = RendererNode,
  HostElement = RendererElement,
  ExtraProps = { [key: string]: any }
> {
  __v_isVNode: boolean;
  type: string | Component;
  props: ExtraProps | null;
  key: string | number | symbol | null;
  el: HostNode | null;
  children: VNode[] | string | undefined;
  shapeFlag: ShapeFlags;
}
//创建虚拟节点
//组件，元素，文本
export function createVnode(type: string, props: any, children?: VNode[] | string): VNode {
  //children  <div>123</div>  <div><span>123</span></div>
  //设置主类型
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : ShapeFlags.COMPONENT;
  //返回的vnode shapeFlag里就包含了 node 和children的类型和关系
  const VNode: VNode = {
    __v_isVNode: true,
    type,
    props,
    key: props?.["key"],
    el: null,
    children,
    shapeFlag,
  };
  if (children) {
    let type = 0;
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN;
    } else {
      children = String(children);
      type = ShapeFlags.TEXT_CHILDREN;
    }
    //包含子节点 | 或运算符
    //node主类型包含子类型
    VNode.shapeFlag |= type;
  }
  return VNode;
}
