import { isArray } from "@mvue/shard/";
import { isString, ShapeFlags } from "@mvue/shard";
//文本节点vnode类型
export const Text = Symbol("Text");
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
  children: VNode[] | string | null;
  shapeFlag: ShapeFlags;
}
//创建虚拟节点
//组件，元素，文本
export function createVnode(
  type: string | symbol,
  props: any,
  children: VNode[] | string | null = null
): VNode {
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
    //包含子节点 | 或运算符
    //node主类型包含子类型
    VNode.shapeFlag |= isArray(children) ? ShapeFlags.ARRAY_CHILDREN : ShapeFlags.TEXT_CHILDREN;
  }
  return VNode;
}
//根据children[] type创建vnode
export const normalizeVNode = (child: VNode | string) => {
  //将字符串children转换为vnode
  return isString(child) ? createTextVnode(child) : child;
};

export const createTextVnode = (text: string | null) => {
  return createVnode(Text, null, text);
};
