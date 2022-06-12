import { isSameVnode, ShapeFlags } from "@mvue/shard";
import { normalizeVNode, VNode, Text } from "./vnode";

export interface RendererNode {
  [key: string]: any;
}

export interface RendererElement extends RendererNode {}

export interface RendererOptions<HostNode = RendererNode, HostElement = RendererElement> {
  patchProp(
    el: HostElement,
    key: string,
    prevValue: any,
    nextValue: any,
    isSVG?: boolean,
    prevChildren?: VNode<HostNode, HostElement>[]
    // parentComponent?: ComponentInternalInstance | null,
    // parentSuspense?: SuspenseBoundary | null,
    // unmountChildren?: UnmountChildrenFn
  ): void;
  insert(el: HostNode, parent: HostElement, anchor?: HostNode | null): void;
  remove(el: HostNode): void;
  createElement(
    type: string,
    isSVG?: boolean,
    isCustomizedBuiltIn?: string
    // vnodeProps?: (VNodeProps & { [key: string]: any }) | null
  ): HostElement;
  createText(text: string): HostNode;
  createComment(text: string): HostNode;
  setText(node: HostNode, text: string): void;
  setElementText(node: HostElement, text: string): void;
  parentNode(node: HostNode): HostElement | null;
  nextSibling(node: HostNode): HostNode | null;
  querySelector?(selector: string): HostElement | null;
  setScopeId?(el: HostElement, id: string): void;
  cloneNode?(node: HostNode): HostNode;
  insertStaticContent?(
    content: string,
    parent: HostElement,
    anchor: HostNode | null,
    isSVG: boolean,
    start?: HostNode | null,
    end?: HostNode | null
  ): [HostNode, HostNode];
}

export const createRenderer = (options: RendererOptions) => {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
  } = options;

  const patch = (n1: VNode | null, n2: VNode, containernt: RendererElement) => {
    if (n1 === n2) return;
    //节点不相同 删除旧的节点
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      //设置为null,下面就走创建
      n1 = null;
    }
    const { type, shapeFlag } = n2;
    //初始渲染
    switch (type) {
      case Text:
        processText(n1, n2, containernt);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, containernt);
        }
        break;
    }
  };
  const render = (vnode: VNode, container: RendererElement) => {
    if (!vnode) {
      //无node,卸载组件
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };

  //处理文本节点
  const processText = (n1: VNode | null, n2: VNode, containernt: RendererElement) => {
    if (n1 === null) {
      n2.el = hostCreateText(n2.children as string);
      hostInsert(n2.el as RendererElement, containernt);
    } else {
      //更新
      //文本节点相同 复用节点 设置文本
      n2.el = n1.el;
      if (n2.children !== n1.children) {
        hostSetText(n2.el as RendererElement, n2.children as string);
      }
    }
  };
  //处理元素节点
  const processElement = (n1: VNode | null, n2: VNode, containernt: RendererElement) => {
    if (n1 === null) {
      mountElement(n2, containernt);
    } else {
      //更新
      patchElement(n1, n2, containernt);
    }
  };

  //挂载创建元素节点
  const mountElement = (vnode: VNode, container: RendererElement) => {
    let { type, el, props, children, shapeFlag } = vnode;
    //创建节点
    el = vnode.el = hostCreateElement(type as string);
    if (props) {
      for (const key in props) {
        //挂载属性
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // debugger;
    if (children) {
      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        //挂载文本
        hostSetElementText(el, children as string);
      }
      //挂载子节点
      else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        for (let i = 0; i < children.length; i++) {
          //处理children数组里面包含string文本的情况
          //createvnode中只处理了children为数组，并没有解开数组
          let child = normalizeVNode(children[i]);
          patch(null, child, el);
        }
      }
    }
    //挂载到container
    hostInsert(el, container);
  };
  //卸载元素节点
  const unmount = (vnode: VNode) => {
    hostRemove(vnode.el as RendererElement);
  };
  //更新元素节点
  const patchElement = (n1: VNode, n2: VNode, containernt: RendererElement) => {
    //复用节点
    let el = (n2.el = n1.el);
    //对比属性
    let oldProps = n1.props || {};
    let newProps = n2.props || {};
    patchProps(el as RendererElement, oldProps, newProps);
    //对比子节点
    patchChildren(n1, n2, el as RendererElement);
  };
  //比较props
  const patchProps = (el: RendererElement, oldProps: any, newProps: any) => {
    for (const key in oldProps) {
      //删除属性
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
    for (const key in newProps) {
      //更新属性
      if (oldProps[key] !== newProps[key]) {
        hostPatchProp(el, key, oldProps[key], newProps[key]);
      }
    }
  };
  //比较children
  const patchChildren = (n1: VNode, n2: VNode, containernt: RendererElement) => {
    const c1 = n1.children;
    const c2 = n2.children;
    //可能为null,文本，数组
  };
  return {
    render,
  };
};
