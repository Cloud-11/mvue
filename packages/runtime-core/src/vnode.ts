import {
  isString,
  isArray,
  isVNode,
  ShapeFlags,
  iteratorAny,
  isObject,
  PatchFlags,
} from "@mvue/shard";

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

export type Provides = { [key: string]: any };
export interface ComponentInstance extends RendererNode {
  data: any;
  setupState?: any;
  subTree: VNode | null;
  mounted: boolean;
  vnode: VNode;
  parent: ComponentInstance | null;
  provides: Provides;
  proxy: ComponentInstance | null;
  next?: VNode | null;
  props: iteratorAny | null;
  propsOptions: iteratorAny<string, TypeConstructor>;
  attrs: iteratorAny;
  slots: iteratorAny<string, () => void>;
  update: () => void;
  render: (_ctx: ComponentInstance) => VNode;
}

//创建虚拟节点
//组件，元素，文本
export namespace VNodeName {
  export type type = string | symbol | Component;
  export type children = VNode[] | string | iteratorAny<string, () => VNode> | null;
}
export interface VNode<
  HostNode = RendererNode,
  HostElement = RendererElement,
  ExtraProps = iteratorAny
> {
  __v_isVNode: boolean;
  type: VNodeName.type;
  props: ExtraProps | null;
  key: string | number | symbol | null;
  el: HostNode | null;
  children: VNodeName.children;
  dynamicChildren?: VNode[] | null;
  shapeFlag: ShapeFlags;
  component: ComponentInstance | null;
}
export function createVnode(
  type: VNodeName.type,
  props: any,
  children: VNodeName.children = null
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
    VNode.shapeFlag |= isArray(children)
      ? ShapeFlags.ARRAY_CHILDREN
      : isObject(children)
      ? ShapeFlags.SLOTS_CHILDREN
      : ShapeFlags.TEXT_CHILDREN;
  }
  return VNode;
}
//根据children[] type创建vnode
export const normalizeVNode = (child: VNode | string) => {
  //将字符串children转换为vnode
  return isVNode(child) ? child : createTextVNode(String(child));
};

export const createTextVNode = (text: string | null) => {
  return createVnode(Text, null, text);
};

//全局变量 存储vnode
let currentBlock: VNode[] | null = null;
export const openBlock = () => {
  currentBlock = [];
};

export const createElementBlock = (
  type: VNodeName.type,
  props: any,
  children: VNodeName.children = null,
  patchFlags: PatchFlags
) => {
  //block
  return setupBlock(createElementVNode(type, props, children, patchFlags));
};

export const setupBlock = (vnode: VNode) => {
  //将vnode存储到currentBlock中
  vnode.dynamicChildren = currentBlock;
  currentBlock = null;
  return vnode;
};

export const createElementVNode = (
  type: VNodeName.type,
  props: any,
  children: VNodeName.children = null,
  patchFlags: PatchFlags
) => {
  const vnode = createVnode(type, props, children);
  if (patchFlags > 0) {
    //先存储到currentBlock中
    //之后创建block时添加到父级节点的dymamicChildren中
    currentBlock = currentBlock || [];
    currentBlock.push(vnode);
  }
  return vnode;
};

//转string
export const toDisplayString = (val: any) => {
  return isString(val) ? val : isObject(val) ? JSON.stringify(val) : String(val);
};
