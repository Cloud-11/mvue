import {
  CREATE_ELEMENT_BLOCK,
  CREATE_ELEMENT_VNODE,
  FRAGMENT,
  OPEN_BLOCK,
  TO_DISPLAY_STRING,
} from "./runtimeHelpers";
import {
  createVNodeCall,
  NodeExitFn,
  NodeTransform,
  NodeTypes,
  RootNode,
  TemplateChildNode,
  TextCallNode,
  TransformContext,
  VNodeCall,
} from "./ast";
import { transformElement } from "./transforms/transformElement";
import { transformExpression } from "./transforms/transformExpression";
import { transformText } from "./transforms/transformText";
import { isElementNode } from "./utils";

export function transform(ast: RootNode) {
  //解析模板字符串到ast
  const context = createtransformContext(ast);
  //转译ast
  traverse(ast, context);
  createRootCodegen(ast, context);
}

function createtransformContext(root: RootNode) {
  const context: TransformContext = {
    currentNode: root, //当前节点
    parentNode: null, //父节点
    helpers: new Map(), //优化 超过20个相同节点转字符串
    removeHelper(name) {
      const count = context.helpers.get(name);
      if (count) {
        let currentCount = count - 1;
        if (!currentCount) {
          context.helpers.delete(name);
        } else {
          context.helpers.set(name, currentCount);
        }
      }
    },
    helper(name) {
      //获取创建函数调用次数 createTextVnode...
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
      return name;
    },
    nodetransforms: [transformElement, transformText, transformExpression],
  };
  return context;
}

function traverse(node: RootNode | TemplateChildNode, context: TransformContext) {
  context.currentNode = node;
  const transforms = context.nodetransforms;
  //退出函数 全部子节点处理完成后需要处理的
  const exitFns: NodeExitFn[] = [];
  for (let i = 0; i < transforms.length; i++) {
    const exitFn = transforms[i](node, context);
    if (exitFn) {
      exitFns.push(exitFn);
    }
    //当前节点被删除
    if (!context.currentNode) {
      return;
    }
  }
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ELEMENT:
      break;
    case NodeTypes.ROOT:
      for (let i = 0; i < (node as RootNode).children.length; i++) {
        context.parentNode = node;
        traverse((node as RootNode).children[i], context);
      }
  }
  context.currentNode = node;
  let i = exitFns.length;
  while (i > 0) {
    exitFns[i - 1]();
    i--;
  }
}

export function createRootCodegen(root: RootNode, context: TransformContext) {
  let { children } = root;
  if (children.length === 1) {
    if (isElementNode(children[0]) && children[0].codegenNode) {
      root.codegenNode = children[0].codegenNode;
      //移除
      context.removeHelper(CREATE_ELEMENT_VNODE);
      context.helper(OPEN_BLOCK);
      context.helper(CREATE_ELEMENT_BLOCK);
      (root.codegenNode as VNodeCall).isBlock = true;
    } else {
      root.codegenNode = (children[0] as TextCallNode).codegenNode;
    }
  } else {
    root.codegenNode = createVNodeCall(context, context.helper(FRAGMENT), undefined, children);
    context.helper(OPEN_BLOCK);
    context.helper(CREATE_ELEMENT_BLOCK);
    root.codegenNode.isBlock = true;
  }
}
