import { InterpolationNode, RootNode, TemplateChildNode, TextNode } from "./../ast";

import { NodeTypes, TransformContext } from "../ast";
export function transformExpression(node: RootNode | TemplateChildNode, context: TransformContext) {
  if (node.type === NodeTypes.INTERPOLATION) {
    processExpression(node as InterpolationNode, context);
  }
}

function processExpression(node: InterpolationNode, context: TransformContext) {
  const varName = node.content.content;
  node.content.content = `_ctx.${varName}`;
}
