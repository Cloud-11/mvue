import {
  CompoundExpressionNode,
  ElementNode,
  InterpolationNode,
  Node,
  NodeTypes,
  ParserContext,
  Position,
  RootNode,
  SourceLocation,
  TextNode,
} from "./ast";
import {
  CREATE_BLOCK,
  CREATE_ELEMENT_BLOCK,
  CREATE_ELEMENT_VNODE,
  CREATE_VNODE,
} from "./runtimeHelpers";

/**
 * 去除空格回车等空字符
 * @param context
 */
export function advanceBySpaces(context: ParserContext) {
  const match = /^[ \t\r\n]+/.exec(context.source);
  if (match != null) {
    advanceBy(context, match[0].length);
  }
}

/**
 * 获取当前位置信息
 * @param context
 * @param start
 * @param end
 * @returns
 */
export function getSelection(
  context: ParserContext,
  start: Position,
  end?: Position
): SourceLocation {
  end = end || getCursor(context);
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset),
  };
}

/**
 * 获取文本，并从source中截取掉
 * @param context
 * @param endIndex
 * @returns
 */
export function paserTextData(context: ParserContext, endIndex: number) {
  //获取数据
  let text = context.source.slice(0, endIndex);
  //已获取的数据截取掉
  advanceBy(context, endIndex);
  return text;
}

/**
 * 根据endIndex修改位置信息
 * @param context
 * @param source
 * @param endIndex
 */
export function advancePositionWithMutation(context: Position, source: string, endIndex: number) {
  let line = 0;
  //换行后的index位置
  let lineStartPos = -1;
  for (let i = 0; i < endIndex; i++) {
    //取asc 10为换行符
    if (source.charCodeAt(i) == 10) {
      line++;
      lineStartPos = i;
    }
  }
  context.line += line;
  //如果此次截取没有换行 ，则直接加上此次结束index(长度),
  //换行了，则是结束位置减去换行后的第一个位置 就等于新的一行的列
  context.column = lineStartPos == -1 ? context.column + endIndex : endIndex - lineStartPos;
  context.offset += endIndex;
}
/**
 * 从开始截取endIndex长度并更新偏移信息
 * @param context
 * @param endIndex
 */
export function advanceBy(context: ParserContext, endIndex: number) {
  //已获取的数据截取掉
  let source = context.source;
  //更新偏移信息
  advancePositionWithMutation(context, source, endIndex);
  context.source = source.slice(endIndex);
}

/**
 * 获取context的line,column,offset
 * @param context
 * @returns
 */
export function getCursor(context: ParserContext) {
  let { line, column, offset } = context;
  return { line, column, offset };
}

/**
 * 创建context数据
 * @param template
 * @returns
 */
export function createPaserContext(template: string) {
  return {
    line: 1, //行
    column: 1, //列
    offset: 0, //偏移
    source: template, //源模板
    originalSource: template, //原始模板
  };
}
/**
 * 判断字符是否解析完成
 * @param context
 * @returns
 */
export function isEnd(context: ParserContext) {
  if (context.source.startsWith("</")) {
    //如果是结束标签开头，说明没有子内容
    return true;
  }
  //source 需要解析的字符为空 结束
  return !context.source;
}

export const createTextNode = (content: string): TextNode => {
  return {
    type: NodeTypes.TEXT,
    content,
    loc: {
      start: { line: 0, column: 0, offset: 0 },
      end: { line: 0, column: 0, offset: 0 },
      source: content,
    },
  };
};

export const isRootNode = (node: Node): node is RootNode => node.type === NodeTypes.ROOT;
export const isElementNode = (node: Node): node is ElementNode => node.type === NodeTypes.ELEMENT;
export const isTextNode = (node: Node): node is TextNode => node.type === NodeTypes.TEXT;
export const isInterpolationNode = (node: Node): node is InterpolationNode =>
  node.type === NodeTypes.INTERPOLATION;
export const isCompoundExpressionNode = (node: Node): node is CompoundExpressionNode =>
  node.type === NodeTypes.COMPOUND_EXPRESSION;

export function getVNodeHelper(isComponent: boolean) {
  return isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE;
}

export function getVNodeBlockHelper(isComponent: boolean) {
  return isComponent ? CREATE_BLOCK : CREATE_ELEMENT_BLOCK;
}
