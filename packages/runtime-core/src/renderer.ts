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
  setElementText(node: HostElement, text: string | null): void;
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

  const patch = (
    n1: VNode | null,
    n2: VNode,
    containernt: RendererElement,
    anchor: RendererElement | null = null
  ) => {
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
        processText(n1, n2, containernt, anchor);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, containernt, anchor);
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
  const processText = (
    n1: VNode | null,
    n2: VNode,
    containernt: RendererElement,
    anchor: RendererElement | null = null
  ) => {
    if (n1 === null) {
      n2.el = hostCreateText(n2.children as string);
      hostInsert(n2.el as RendererElement, containernt, anchor);
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
  const processElement = (
    n1: VNode | null,
    n2: VNode,
    containernt: RendererElement,
    anchor: RendererElement | null = null
  ) => {
    if (n1 === null) {
      mountElement(n2, containernt, anchor);
    } else {
      //更新
      patchElement(n1, n2, containernt);
    }
  };

  //挂载创建元素节点
  const mountElement = (
    vnode: VNode,
    container: RendererElement,
    anchor: RendererElement | null = null
  ) => {
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
        mountChildren(children as VNode[], el);
      }
    }
    //挂载到container
    hostInsert(el, container, anchor);
  };
  //挂载更新元素节点
  const mountChildren = (children: VNode[], el: RendererElement) => {
    for (let i = 0; i < children.length; i++) {
      //处理children数组里面包含string文本的情况
      //createvnode中只处理了children为数组，并没有解开数组
      let child = normalizeVNode(children[i]);
      patch(null, child, el);
    }
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
  const patchChildren = (n1: VNode, n2: VNode, el: RendererElement) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const shapeFlag1 = n1.shapeFlag;
    const shapeFlag2 = n2.shapeFlag;
    //可能为null,文本，数组
    // old   new
    // null  null
    // null  文本
    // null  数组
    //-----以上n1为Null 为新增 不会进入对比----------
    // 文本  null
    if (shapeFlag1 & ShapeFlags.TEXT_CHILDREN) {
      if (c2 == null || shapeFlag2 & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(el, c2 as string);
      } else if (shapeFlag2 & ShapeFlags.ARRAY_CHILDREN) {
        //文本+数组
        hostSetElementText(el, null);
        mountChildren(c2 as VNode[], el);
      }
    } else if (shapeFlag1 & ShapeFlags.ARRAY_CHILDREN) {
      if (c2 == null || shapeFlag2 & ShapeFlags.TEXT_CHILDREN) {
        //数组+文本
        unmountChildren(c1 as VNode[]);
        if (c1 !== c2) {
          hostSetElementText(el, c2 as string);
        }
      } else if (shapeFlag2 & ShapeFlags.ARRAY_CHILDREN) {
        //数组+数组
        // diff()
        patchKeyedChildren(c1 as VNode[], c2 as VNode[], el);
      }
    }
  };
  //比较keyedChildren

  const patchKeyedChildren = (c1: VNode[], c2: VNode[], el: RendererElement) => {
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    let i = 0;
    //向后查找
    //i指针移动到新或旧最后一个元素停止
    while (i <= e1 && i <= e2) {
      if (isSameVnode(c1[i], c2[i])) {
        patch(c1[i], c2[i], el);
      } else {
        //遇到不同元素（要新增的）退出
        break;
      }
      i++;
    }
    console.log(i, e1, e2);
    //向前查找
    //经过前一个查找吗，i指针指向最短的最后元素+1的位置
    //
    // i = 0;
    //  0 1 2
    //0 1 2 3
    while (i <= e1 && i <= e2) {
      if (isSameVnode(c1[e1], c2[e2])) {
        patch(c1[e1], c2[e2], el);
      } else {
        //遇到不同元素（要新增的）退出
        break;
      }
      e1--;
      e2--;
    }
    //i=3 e1=2 e2=3 这种情况是全部走完了向后查找 i永远大于e1 向前查找进不去。
    //   0 1 2
    // 0 1 2 3
    //i=1 e1=2 e2=3
    //这种情况是走了i次向后查找，到处跳出，此时i<e1.再进入向前查找。e1、e2--到i的位置。
    //对向后查找进行补充，不会重复指向
    //最后，即使向前查找也跳出，
    //  a c d
    //a b e d
    console.log(i, e1, e2);
    //有key同序列新增
    //i>e1 有新增元素
    if (i > e1) {
      // debugger;
      //新增元素
      while (i <= e2) {
        const anchor = e2 + 1 > c2.length ? c2[e2 + 1].el : null;
        patch(null, c2[i], el, anchor);
        i++;
      }
    }
    //有key同序列删除
    else if (i > e2) {
      //删除元素
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    }

    //乱序比对
    // a b [c d e] f g
    // a b [e c d h] f g
    //新增元素 查找新元素有，老元素没有
    type key = string | number | symbol;
    const newVNodeMap = new Map<key, number>();

    //存储i值
    const s1 = i;
    const s2 = i;
    //新的元素区域数量 新元素需要比较的长度
    let toBePatched = e2 - s2 + 1;
    //新的元素排列顺序对应的老的元素下标  [d=3 c=2 e=4 h=0]
    const newIndexToOldIndexMap = new Array(toBePatched);
    for (let i = 0; i < newIndexToOldIndexMap.length; i++) {
      newIndexToOldIndexMap[i] = 0;
    }

    //遍历中间区域新元素 存储key和index
    for (i = s2; i <= e2; i++) {
      c2[i]?.key && newVNodeMap.set(c2[i].key as key, i);
    }

    //遍历中间区域老元素
    for (i = s1; i <= e1; i++) {
      const oldVNode = c1[i];
      const newIndex = newVNodeMap.get(oldVNode.key as key);
      //老元素没在新的里面，要卸载
      if (newIndex === undefined) {
        unmount(oldVNode);
      } else {
        //存在的，有些需要移动 需要找出最少移动次数  移动实际是卸载重建
        //移动需要判断位置 位置= index
        // a b [c d e ss] f g
        // a b [e c d h] f g    4 2 3 0
        //标记老的index
        newIndexToOldIndexMap[newIndex - s2] = i;
        //
        patch(oldVNode, c2[newIndex], el);
      }

      //其他的要新增
    }
    //最小递增子序列
    const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap) || [];
    let j = increasingNewIndexSequence.length - 1;

    for (let i = toBePatched - 1; i >= 0; i--) {
      const newIndex = i + s2;
      const newChild = c2[newIndex];
      const anchor = newIndex + 1 < c2.length ? c2[newIndex + 1].el : null;
      if (newIndexToOldIndexMap[i] === 0) {
        mountElement(newChild, el, anchor);
      } else {
        //老元素和新元素位置不同，需要移动
        //有些虽然位置不同但是元素是相同的，减少因位置不同的移动次数
        //最小递增子序列
        if (j < 0 || i !== increasingNewIndexSequence[j]) {
          hostInsert(newChild.el as VNode, el, anchor);
        } else {
          j--;
        }
      }
    }
  };
  //最小递增子序列
  const getSequence = (arr: number[]) => {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
      const arrI = arr[i];
      if (arrI !== 0) {
        j = result[result.length - 1];
        if (arr[j] < arrI) {
          p[i] = j;
          result.push(i);
          continue;
        }
        u = 0;
        v = result.length - 1;
        while (u < v) {
          c = (u + v) >> 1;
          if (arr[result[c]] < arrI) {
            u = c + 1;
          } else {
            v = c;
          }
        }
        if (arrI < arr[result[u]]) {
          if (u > 0) {
            p[i] = result[u - 1];
          }
          result[u] = i;
        }
      }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
      result[u] = v;
      v = p[v];
    }
    return result;
  };
  //卸载循环子节点
  const unmountChildren = (children: VNode[]) => {
    for (let i = 0; i < children.length; i++) {
      if (children[i].shapeFlag & ShapeFlags.ELEMENT) {
        unmount(children[i]);
      }
    }
  };
  return {
    render,
  };
};
