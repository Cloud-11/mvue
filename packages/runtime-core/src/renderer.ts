import { ReactiveEffect } from "@mvue/reactivity";
import { isSameVnode, loopRunArrayFns, PatchFlags, ShapeFlags } from "@mvue/shard";
import { LifecycleHooks } from "./apiLifeCycle";
import { createComponentInstance, setupComponent } from "./component";
import { patchComponentProps, shouldUpdateProps } from "./componentProps";
import { queueJob } from "./scheduler";
import {
  normalizeVNode,
  VNode,
  Text,
  Fragment,
  RendererNode,
  RendererElement,
  ComponentInstance,
} from "./vnode";

export interface RendererOptions<HostNode = RendererNode, HostElement = RendererElement> {
  patchProp(
    el: HostElement,
    key: string,
    prevValue: any,
    nextValue: any,
    isSVG?: boolean,
    prevChildren?: VNode<HostNode, HostElement>[],
    parentComponent?: ComponentInstance | null
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
    anchor: RendererElement | null = null,
    parentComponent: ComponentInstance | null = null
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
      case Fragment:
        processFragment(n1, n2, containernt, parentComponent);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, containernt, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, containernt, anchor, parentComponent);
        }
        break;
    }
  };
  const render = (vnode: VNode, container: RendererElement) => {
    if (!container) {
      console.error("ERROR:container dont undefind!");
      return;
    }
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
  //处理空节点
  const processFragment = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
    parentComponent: ComponentInstance | null = null
  ) => {
    if (n1 == null) {
      mountChildren(n2?.children as VNode[], container, parentComponent);
    } else {
      patchChildren(n1, n2, container);
    }
  };
  //处理组件节点
  const processComponent = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
    anchor: RendererElement | null = null,
    parentComponent: ComponentInstance | null = null
  ) => {
    if (n1 === null) {
      mountComponent(n2, container, anchor, parentComponent);
    } else {
      patchComponent(n1, n2);
    }
  };

  //挂载组件
  const mountComponent = (
    vnode: VNode,
    container: RendererElement,
    anchor: RendererElement | null = null,
    parentComponent: ComponentInstance | null = null
  ) => {
    //创建组件实例
    let instance = (vnode.component = createComponentInstance(vnode, parentComponent));
    //初始化组件
    setupComponent(instance);
    //渲染挂载
    setupRenderEffect(instance, container, anchor);
  };
  //组件渲染Effect
  const setupRenderEffect = (
    instance: ComponentInstance,
    container: RendererElement,
    anchor: RendererElement | null = null
  ) => {
    //闭包内的结构出来的变量不会随着闭包外的变量改变
    const componentUpdateFn = () => {
      let { render } = instance;
      if (!instance.mounted) {
        //初始化 未挂载
        //生命周期钩子
        if (instance[LifecycleHooks.BEFORE_MOUNT]) {
          loopRunArrayFns(instance[LifecycleHooks.BEFORE_MOUNT]);
        }
        instance.subTree = render?.call(
          instance.proxy,
          instance.proxy as ComponentInstance
        ) as VNode;
        patch(null, instance.subTree, container, anchor, instance);
        instance.mounted = true;
        //生命周期钩子
        if (instance[LifecycleHooks.MOUNTED]) {
          loopRunArrayFns(instance[LifecycleHooks.MOUNTED]);
        }
      } else {
        //比对props
        if (instance.next) {
          instance.vnode = instance.next;
          instance.next = null;
          patchComponentProps(instance.props, instance.vnode.props);
        }
        //生命周期钩子
        if (instance[LifecycleHooks.BEFORE_UPDATE]) {
          loopRunArrayFns(instance[LifecycleHooks.BEFORE_UPDATE]);
        }
        //更新
        let newSubTree = render?.call(instance.proxy, instance.proxy as ComponentInstance) as VNode;
        //props是浅层代理，会收集此effect。
        //所以props改变，会走这里，下一行的会进行比对再走到patchComponent
        patch(instance.subTree, newSubTree, container, anchor, instance);
        instance.subTree = newSubTree;
        //生命周期钩子
        if (instance[LifecycleHooks.UPDATED]) {
          loopRunArrayFns(instance[LifecycleHooks.UPDATED]);
        }
      }
    };
    const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update));
    //强制更新函数
    instance.update = effect.run.bind(effect); //this指向effect
    effect.run();
  };
  //更新组件
  const patchComponent = (n1: VNode, n2: VNode) => {
    //组件复用实例
    const instance = (n2.component = n1.component as ComponentInstance);
    //更新组件
    if (shouldUpdateComponent(n1, n2)) {
      // debugger;
      instance.next = n2;
      instance.update();
    }
  };
  const shouldUpdateComponent = (n1: VNode, n2: VNode) => {
    const { props: oldProps, children: oldChildren } = n1;
    const { props: newProps, children: newChildren } = n2;
    if (oldProps === newProps) return false;
    if (oldChildren || newChildren) return true;
    if (shouldUpdateProps(oldProps, newProps)) {
      return true;
    }
    return false;
  };
  //处理元素节点
  const processElement = (
    n1: VNode | null,
    n2: VNode,
    container: RendererElement,
    anchor: RendererElement | null = null,
    parentComponent: ComponentInstance | null = null
  ) => {
    if (n1 === null) {
      mountElement(n2, container, anchor, parentComponent);
    } else {
      //更新
      patchElement(n1, n2);
    }
  };

  //挂载创建元素节点
  const mountElement = (
    vnode: VNode,
    container: RendererElement,
    anchor: RendererElement | null = null,
    parentComponent: ComponentInstance | null = null
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
        mountChildren(children as VNode[], el, parentComponent);
      }
    }
    //挂载到container
    hostInsert(el, container, anchor);
  };
  //挂载更新元素节点
  const mountChildren = (
    children: VNode[],
    el: RendererElement,
    parentComponent: ComponentInstance | null = null
  ) => {
    for (let i = 0; i < children.length; i++) {
      //处理children数组里面包含string文本的情况
      //createvnode中只处理了children为数组，并没有解开数组
      let child = normalizeVNode(children[i]);
      patch(null, child, el, null, parentComponent);
    }
  };
  //卸载元素节点
  const unmount = (vnode: VNode) => {
    hostRemove(vnode.el as RendererElement);
  };
  //更新元素节点
  const patchElement = (n1: VNode, n2: VNode, parentComponent: ComponentInstance | null = null) => {
    //复用节点
    let el = (n2.el = n1.el) as VNode;
    //对比属性
    let oldProps = n1.props || {};
    let newProps = n2.props || {};
    patchProps(el as RendererElement, oldProps, newProps);
    //如果有动态子节点，则对比动态子节点
    if (el.dynamicChildren && el.dynamicChildren.length > 0) {
      patchBlockChildren(n1, n2, parentComponent);
    } else {
      //全量对比子节点
      patchChildren(n1, n2, el as RendererElement, parentComponent);
    }
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
  const patchBlockChildren = (n1: VNode, n2: VNode, parentComponent: ComponentInstance | null) => {
    for (let i = 0; i < (n2.dynamicChildren as VNode[])?.length; i++) {
      patchElement(
        (n1.dynamicChildren as VNode[])[i],
        (n2.dynamicChildren as VNode[])[i],
        parentComponent
      );
    }
  };
  //比较children
  const patchChildren = (
    n1: VNode,
    n2: VNode,
    el: RendererElement,
    parentComponent: ComponentInstance | null = null
  ) => {
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
        mountChildren(c2 as VNode[], el, parentComponent);
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
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

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
        //标记老的index
        newIndexToOldIndexMap[newIndex - s2] = i + 1;
        //在c2中找到c1的老元素(key相同type相同)  继续比对属性和儿子
        //说明
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
        //存在的，有些需要移动 需要找出最少移动次数
        //移动需要判断位置 位置= index
        // a b [c d e ss] f g
        // a b [e c d h] f g    4 2 3 0
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
    //1.贪心算法  不停向后查找递增的  比前面小的要替换掉
    //[4, 2, 3, -1]
    let result = [0]; //保存arr索引
    let p = new Array(arr.length).fill(undefined); //保存前面的索引
    for (let i = 1; i < arr.length; i++) {
      //判断值的大小 取索引数组result的最后一个值(索引)对应arr的值
      if (arr[i] > arr[result[result.length - 1]]) {
        p[i] = result[result.length - 1];
        result.push(i);
        continue;
      }
      //2.替换掉比前面小的 使用二分查找
      //比前面小的要替换掉
      let start = 0;
      let end = result.length - 1;
      while (start < end) {
        const mid = ((start + end) / 2) | 0;
        if (arr[i] > arr[result[mid]]) {
          start = mid + 1;
        } else {
          end = mid;
        }
      }
      //3.得到序列的值是递增的  但是位置(index索引)没有检验
      if (arr[i] < arr[result[start]]) {
        result[start] = i;
      }
    }
    //5.检验位置是否递增 将不合法的替换操作还原
    let i = result.length - 1;
    while (i >= 0) {
      result[i - 1] = p[result[i]];
      i--;
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
