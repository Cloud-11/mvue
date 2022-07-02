import { isString, isArray, isVNode, ShapeFlags, iteratorAny } from "@mvue/shard";

//文本节点vnode类型
export const Text = Symbol("Text");
//空节点类型
export const Fragment = Symbol("Fragment");

export interface RendererNode {
  [key: string]: any;
}
export interface RendererElement extends RendererNode {}
export type TypeConstructor =
  | StringConstructor
  | ArrayConstructor
  | NumberConstructor
  | BooleanConstructor
  | ObjectConstructor
  | FunctionConstructor;

export interface context {
  solt?: any;
  emit?: any;
}
export interface Component extends RendererNode {
  data?: () => any;
  setup?: (props: iteratorAny, context: context) => iteratorAny | (() => VNode);
  props: iteratorAny<string, TypeConstructor>;
  render: () => VNode;
}

export interface ComponentInstance extends RendererNode {
  data: any;
  setupState?: any;
  subTree: VNode | null;
  mounted: boolean;
  vnode: VNode;
  proxy: ComponentInstance | null;
  next?: VNode | null;
  props: iteratorAny | null;
  propsOptions: iteratorAny<string, TypeConstructor>;
  attrs: iteratorAny;
  update: () => void;
  render: () => VNode;
}
export interface VNode<
  HostNode = RendererNode,
  HostElement = RendererElement,
  ExtraProps = iteratorAny
> {
  __v_isVNode: boolean;
  type: string | symbol | Component;
  props: ExtraProps | null;
  key: string | number | symbol | null;
  el: HostNode | null;
  children: VNode[] | string | null;
  shapeFlag: ShapeFlags;
  component: ComponentInstance | null;
}
//创建虚拟节点
//组件，元素，文本
export function createVnode(
  type: string | symbol | Component,
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
    component: null,
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
  return isVNode(child) ? child : createTextVnode(String(child));
};

export const createTextVnode = (text: string | null) => {
  return createVnode(Text, null, text);
};
