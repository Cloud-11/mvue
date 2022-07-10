import { PatchFlags } from "@mvue/shard";
import {
  CallExpression,
  CompoundExpressionNode,
  createCallExpression,
  NodeTypes,
  RootNode,
  TemplateChildNode,
  TextCallNode,
  TransformContext,
} from "../ast";
import { CREATE_TEXT } from "../runtimeHelpers";
import {
  isInterpolationNode,
  isTextNode,
  isElementNode,
  isRootNode,
  isCompoundExpressionNode,
} from "../utils";

export function transformText(node: RootNode | TemplateChildNode, context: TransformContext) {
  return () => {
    if (!(isElementNode(node) || isRootNode(node))) {
      return;
    }
    //连续的表达式和文本放一起
    //<div> 123 {{aaa}} <span>asd</span>  234  {{bbb}} </div>
    //将  123 {{aaa}} 放一起
    let hasText = false;
    let currentContainer: CompoundExpressionNode | null = null;
    let children = node.children;
    if (!children) return;
    for (let i = 0; i < children.length; i++) {
      let child = children[i];
      if (isTextNode(child) || isInterpolationNode(child)) {
        for (let j = i + 1; j < children.length; j++) {
          const next = children[j];
          if (isTextNode(next) || isInterpolationNode(next)) {
            hasText = true;
            //连续文本和表达式节点 放在一起
            if (!currentContainer) {
              currentContainer = children[i] = {
                type: NodeTypes.COMPOUND_EXPRESSION,
                children: [child],
                loc: child.loc,
              };
            }
            //合并节点
            currentContainer.children.push(`+`, next);
            children.splice(j, 1);
            j--;
          } else {
            //遇到一个非文本节点 即文本节点不连续 则退出
            currentContainer = null;
            break;
          }
        }
      }
    }
    //如果最后合并后长度为1 表示子节点只有一个 text和模板表达式 <div>123{{aa}}</div>
    //createElementVnode('div',toDisplayString(_ctx.aa)+"123"),1/*TEXT */)
    //如果不退出 就是下方的创建方式,多创建一个节点
    //createElementVnode('div',createTextVnode(toDisplayString(_ctx.aa)+"123"),1/*TEXT */))
    if (!hasText && children.length === 1) return;

    //模板表达式 即动态节点 添加flag
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const callArgs: CallExpression["arguments"] = [];
      if (isTextNode(child) || isInterpolationNode(child) || isCompoundExpressionNode(child)) {
        callArgs.push(child);
        if (!isTextNode(child)) {
          //动态文本节点标识 应用靶向更新
          callArgs.push(PatchFlags.TEXT + "");
        }
        children[i] = {
          type: NodeTypes.TEXT_CALL,
          content: child,
          codegenNode: createCallExpression(context.helper(CREATE_TEXT), callArgs),
        } as TextCallNode;
      }
    }
  };
}
