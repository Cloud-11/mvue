import { isString } from "@mvue/shard";
import { RENDER_SLOT } from "./runtimeHelpers";
import { getVNodeHelper } from "./utils";

export const enum NodeTypes {
  ROOT, //根节点
  ELEMENT, //元素
  TEXT, //标签
  COMMENT, //注释
  SIMPLE_EXPRESSION, //简单表达式 a="aa"
  INTERPOLATION, //模板表达式 {{asd}}
  ATTRIBUTE, //属性
  DIRECTIVE, //
  // containers
  COMPOUND_EXPRESSION, //复合表达式 {{aa}} asd
  IF,
  IF_BRANCH,
  FOR,
  TEXT_CALL, //文本调用
  // codegen
  VNODE_CALL, //元素调用
  JS_CALL_EXPRESSION, //js调用表达式
  JS_OBJECT_EXPRESSION,
  JS_PROPERTY,
  JS_ARRAY_EXPRESSION,
  JS_FUNCTION_EXPRESSION,
  JS_CONDITIONAL_EXPRESSION,
  JS_CACHE_EXPRESSION,

  // ssr codegen
  JS_BLOCK_STATEMENT,
  JS_TEMPLATE_LITERAL,
  JS_IF_STATEMENT,
  JS_ASSIGNMENT_EXPRESSION,
  JS_SEQUENCE_EXPRESSION,
  JS_RETURN_STATEMENT,
}
export interface ParserContext {
  line: number; //行
  column: number; //列
  offset: number; //偏移
  source: string; //源模板
  readonly originalSource: string; //原始模板
}

export type NodeTransform = (
  node: RootNode | TemplateChildNode,
  context: TransformContext
) => void | NodeExitFn;
export type NodeExitFn = () => void | (() => void)[];
export interface Node {
  type: NodeTypes;
  loc: SourceLocation;
}
export const locStub: SourceLocation = {
  source: "",
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 1, offset: 0 },
};

// The node's range. The `start` is inclusive and `end` is exclusive.
// [start, end)
export interface SourceLocation {
  start: Position;
  end: Position;
  source: string;
}

export interface Position {
  offset: number; // from start of file
  line: number;
  column: number;
}
export const enum ElementTypes {
  ELEMENT,
  COMPONENT,
  SLOT,
  TEMPLATE,
}

export type ElementNode = PlainElementNode | ComponentNode | SlotOutletNode | TemplateNode;

export interface PlainElementNode extends BaseElementNode {
  tagType: ElementTypes.ELEMENT;
  codegenNode:
    | VNodeCall
    | SimpleExpressionNode // when hoisted
    | undefined;
}
export interface SlotOutletNode extends BaseElementNode {
  tagType: ElementTypes.SLOT;
  codegenNode: RenderSlotCall | undefined;
}
export interface RenderSlotCall extends CallExpression {
  callee: typeof RENDER_SLOT;
  arguments: // $slots, name, props, fallback
  | [string, string | ExpressionNode]
    | [string, string | ExpressionNode, PropsExpression]
    | [string, string | ExpressionNode, PropsExpression | "{}", TemplateChildNode[]];
}

export interface ComponentNode extends BaseElementNode {
  tagType: ElementTypes.COMPONENT;
  codegenNode: VNodeCall | undefined;
}
export type TemplateChildNode =
  | ElementNode
  | InterpolationNode
  | TextNode
  | CommentNode
  | CompoundExpressionNode
  | TextCallNode;

export type TemplateTextChildNode = TextNode | InterpolationNode | CompoundExpressionNode;

export type ExpressionNode = SimpleExpressionNode;

export type JSChildNode =
  | VNodeCall
  | CallExpression
  | ObjectExpression
  | ArrayExpression
  | ExpressionNode
  | FunctionExpression;

export interface VNodeCall extends Node {
  type: NodeTypes.VNODE_CALL;
  tag: string | symbol | CallExpression;
  props: PropsExpression | undefined;
  children:
    | TemplateChildNode[] // multiple children
    | TemplateChildNode
    | TemplateTextChildNode // single text child
    | SimpleExpressionNode // hoisted
    | undefined;
  patchFlag: string | undefined;
  dynamicProps: string | SimpleExpressionNode | undefined;
  isBlock: boolean;
  isComponent: boolean;
}
export type PropsExpression = ObjectExpression | CallExpression | ExpressionNode;
export interface ObjectExpression extends Node {
  type: NodeTypes.JS_OBJECT_EXPRESSION;
  properties: Array<Property>;
}
export interface Property extends Node {
  type: NodeTypes.JS_PROPERTY;
  key: ExpressionNode;
  value: JSChildNode;
}
export interface CallExpression extends Node {
  type: NodeTypes.JS_CALL_EXPRESSION;
  callee: string | symbol;
  arguments: (string | symbol | JSChildNode | TemplateChildNode | TemplateChildNode[])[];
}
export interface ArrayExpression extends Node {
  type: NodeTypes.JS_ARRAY_EXPRESSION;
  elements: Array<string | Node>;
}
export interface FunctionExpression extends Node {
  type: NodeTypes.JS_FUNCTION_EXPRESSION;
  params: ExpressionNode | string | (ExpressionNode | string)[] | undefined;
  returns?: TemplateChildNode | TemplateChildNode[] | JSChildNode;
  body?: BlockStatement | IfStatement;
  newline: boolean;
  /**
   * This flag is for codegen to determine whether it needs to generate the
   * withScopeId() wrapper
   */
  isSlot: boolean;
  /**
   * __COMPAT__ only, indicates a slot function that should be excluded from
   * the legacy $scopedSlots instance property.
   */
  isNonScopedSlot?: boolean;
}
export interface BlockStatement extends Node {
  type: NodeTypes.JS_BLOCK_STATEMENT;
  body: (JSChildNode | IfStatement)[];
}
export interface IfStatement extends Node {
  type: NodeTypes.JS_IF_STATEMENT;
  test: ExpressionNode;
  consequent: BlockStatement;
  alternate: IfStatement | BlockStatement | ReturnStatement | undefined;
}
export interface ReturnStatement extends Node {
  type: NodeTypes.JS_RETURN_STATEMENT;
  returns: TemplateChildNode | TemplateChildNode[] | JSChildNode;
}
export interface RootNode extends Node {
  type: NodeTypes.ROOT;
  helpers: symbol[];
  children: TemplateChildNode[];
  codegenNode?: TemplateChildNode | JSChildNode;
}
export interface BaseElementNode extends Node {
  type: NodeTypes.ELEMENT;
  tag: string;
  tagType: ElementTypes;
  isSelfClosing: boolean;
  props?: Array<AttributeNode>;
  children?: TemplateChildNode[];
}
export interface SimpleExpressionNode extends Node {
  type: NodeTypes.SIMPLE_EXPRESSION;
  content: string;
}
export interface InterpolationNode extends Node {
  type: NodeTypes.INTERPOLATION;
  content: ExpressionNode;
}
export interface TemplateNode extends BaseElementNode {
  tagType: ElementTypes.TEMPLATE;
  // TemplateNode is a container type that always gets compiled away
  codegenNode: undefined;
}
export interface TextNode extends Node {
  type: NodeTypes.TEXT;
  content: string;
}
//文本节点函数调用createTextVnode
export interface TextCallNode extends Node {
  type: NodeTypes.TEXT_CALL;
  content: TextNode | InterpolationNode | CompoundExpressionNode;
  codegenNode: CallExpression | SimpleExpressionNode; // when hoisted
}
export interface CompoundExpressionNode extends Node {
  type: NodeTypes.COMPOUND_EXPRESSION;
  children: (
    | SimpleExpressionNode
    | CompoundExpressionNode
    | InterpolationNode
    | TextNode
    | string
    | symbol
  )[];
}
export interface CommentNode extends Node {
  type: NodeTypes.COMMENT;
  content: string;
}

export interface AttributeNode extends Node {
  type: NodeTypes.ATTRIBUTE;
  name: string;
  value: TextNode | undefined;
}

export interface TransformContext {
  currentNode: Node;
  parentNode: Node | null;
  helpers: Map<any, any>;
  removeHelper<T extends symbol>(name: T): void;
  helper<T extends symbol>(name: T): T;
  nodetransforms: NodeTransform[];
}
export function createCallExpression(
  callee: CallExpression["callee"],
  args: CallExpression["arguments"] = [],
  loc: SourceLocation = locStub
): CallExpression {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    loc,
    callee,
    arguments: args,
  };
}

export function createObjectProperty(
  key: Property["key"] | string,
  value: Property["value"]
): Property {
  return {
    type: NodeTypes.JS_PROPERTY,
    loc: locStub,
    key: isString(key) ? createSimpleExpression(key) : key,
    value,
  };
}

export function createObjectExpression(
  properties: ObjectExpression["properties"],
  loc = locStub
): ObjectExpression {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    properties,
    loc,
  };
}
export function createSimpleExpression(
  content: SimpleExpressionNode["content"],
  loc: SourceLocation = locStub
): SimpleExpressionNode {
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    loc,
    content,
  };
}

export function createVNodeCall(
  context: TransformContext | null,
  tag: VNodeCall["tag"],
  props?: VNodeCall["props"],
  children?: VNodeCall["children"],
  patchFlag?: VNodeCall["patchFlag"],
  dynamicProps?: VNodeCall["dynamicProps"],
  isBlock: VNodeCall["isBlock"] = false,
  isComponent: VNodeCall["isComponent"] = false,
  loc = locStub
): VNodeCall {
  if (context) {
    if (isBlock) {
      context.helper(getVNodeHelper(isComponent));
    }
  }
  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    isBlock,
    isComponent,
    loc,
  };
}
