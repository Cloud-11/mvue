import { isArray, isString, isSymbol } from "@mvue/shard";
import {
  InterpolationNode,
  NodeTypes,
  RootNode,
  SimpleExpressionNode,
  TextCallNode,
  TextNode,
  CallExpression,
  TemplateChildNode,
  JSChildNode,
  CompoundExpressionNode,
} from "./ast";
import { helperNameMap, TO_DISPLAY_STRING } from "./runtimeHelpers";

export function generate(root: RootNode) {
  const context = createCodegenGenerate(root);
  const { push, indent, deindent } = context;
  //import
  genFunctionPreable(root, context);
  //render
  const FunctionName = "render";
  const args = ["_ctx", "_cache", "$props"];
  push(` ${FunctionName}(${args.join(",")}){`);
  indent();
  push(`return `);
  if (root.codegenNode) {
    genNode(root.codegenNode, context);
  } else {
    push(`null;`);
  }
  //结束
  deindent();
  push(`}`);
  return context.code;
}

export interface CodegenContext {
  code: string;
  indentLevel: number;
  helper(key: symbol): string;
  push(code: string): void;
  indent(): void;
  deindent(withoutNewLine?: boolean): void;
  newline(): void;
}
export function createCodegenGenerate(root: RootNode) {
  const context: CodegenContext = {
    code: "",
    indentLevel: 0,
    push(code) {
      context.code += code;
    },
    helper(key) {
      return `_${helperNameMap[key]}`;
    },
    indent() {
      //向后缩进
      ++context.indentLevel;
      context.newline();
    },
    deindent() {
      //向前缩进
      --context.indentLevel;
      context.newline();
    },
    newline() {
      context.push("\n" + "  ".repeat(context.indentLevel));
    },
  };
  return context;
}

function genFunctionPreable(root: RootNode, context: CodegenContext) {
  const imports = root.helpers.map((h) => `${helperNameMap[h]} as ${context.helper(h)}`);
  if (imports && imports.length > 0) {
    context.push(`import {${imports.join(",")}} from "mvue"`);
    context.newline();
  }
  context.push("export");
}

function genNode(node: CodegenNode | symbol | string, context: CodegenContext) {
  if (isString(node)) {
    context.push(node);
    return;
  }
  if (isSymbol(node)) {
    context.push(context.helper(node));
    return;
  }
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node as TextNode, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node as InterpolationNode, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genSimpleExpression(node as SimpleExpressionNode, context);
      break;
    case NodeTypes.TEXT_CALL:
      genNode((node as TextCallNode).codegenNode, context);
      break;
    case NodeTypes.JS_CALL_EXPRESSION:
      genJsCallExpression(node as CallExpression, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
  }
}
/**
 * 纯文本
 * @param codegenNode
 * @param context
 */
function genText(codegenNode: TextNode, context: CodegenContext) {
  context.push(JSON.stringify(codegenNode.content));
}

/**
 * 动态节点
 * @param codegenNode
 * @param context
 */
function genInterpolation(codegenNode: InterpolationNode, context: CodegenContext) {
  context.push(`${context.helper(TO_DISPLAY_STRING)}(`);
  genNode(codegenNode.content, context);
  context.push(")");
}

function genSimpleExpression(codegenNode: SimpleExpressionNode, context: CodegenContext) {
  context.push(codegenNode.content);
}
function genJsCallExpression(codegenNode: CallExpression, context: CodegenContext) {
  context.push(`${context.helper(codegenNode.callee as symbol)}(`);
  genNodeList(codegenNode.arguments, context);
  context.push(`)`);
}

type CodegenNode = TemplateChildNode | JSChildNode;
function genNodeList(
  nodes: (string | symbol | CodegenNode | TemplateChildNode[])[],
  context: CodegenContext,
  multilines: boolean = false,
  comma: boolean = true
) {
  const { push, newline } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else if (isArray(node)) {
      genNodeListAsArray(node, context);
    } else {
      genNode(node, context);
    }
    if (i < nodes.length - 1) {
      if (multilines) {
        comma && push(",");
        newline();
      } else {
        comma && push(", ");
      }
    }
  }
}
function genNodeListAsArray(
  nodes: (string | CodegenNode | TemplateChildNode[])[],
  context: CodegenContext
) {
  const multilines = nodes.length > 3;
  context.push(`[`);
  multilines && context.indent();
  genNodeList(nodes, context, multilines);
  multilines && context.deindent();
  context.push(`]`);
}
function genCompoundExpression(node: CompoundExpressionNode, context: CodegenContext) {
  for (let i = 0; i < node.children!.length; i++) {
    const child = node.children![i];
    if (isString(child)) {
      context.push(child);
    } else {
      genNode(child, context);
    }
  }
}
