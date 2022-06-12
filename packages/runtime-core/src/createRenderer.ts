import { ShapeFlags } from "@mvue/shard";
import { VNode } from "./vnode";

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

  //挂载创建节点
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
          mountElement((children as VNode[])[i], el);
        }
      }
    }
    //挂载到container
    hostInsert(el, container);
  };
  const patch = (n1: VNode, n2: VNode, containernt: RendererElement) => {
    if (n1 === n2) return;
    if (!n1) {
      //初始渲染
      mountElement(n2, containernt);
    } else {
      //更新
    }
  };
  const render = (vnode: VNode, container: RendererElement) => {
    if (!vnode) {
      //无node,卸载组件
      container.innerHTML = "";
    } else {
      patch(container._vnode, vnode, container);
    }
  };
  return {
    render,
  };
};
